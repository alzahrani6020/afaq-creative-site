import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { list } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { requireAdmin, UnauthorizedError } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const POLICY_ENV: Record<string, string> = {
  new: 'RETENTION_NEW_DAYS',
  under_review: 'RETENTION_UNDER_REVIEW_DAYS',
  qualified: 'RETENTION_QUALIFIED_DAYS',
  need_information: 'RETENTION_NEED_INFORMATION_DAYS',
  contacted: 'RETENTION_CONTACTED_DAYS',
  accepted: 'RETENTION_ACCEPTED_DAYS',
  rejected: 'RETENTION_REJECTED_DAYS',
};

const ATTACHMENT_FIELDS = ['profile_photo', 'work_photos', 'work_video', 'cv', 'documents'];
const ORPHAN_GRACE_HOURS = Math.max(1, Number(process.env.ORPHAN_GRACE_HOURS || 24));

function parseJson(raw: string | null | undefined): Record<string, any> {
  try {
    const value = JSON.parse(raw || '{}');
    return value && typeof value === 'object' ? value : {};
  } catch {
    return {};
  }
}

function toPathname(url: string): string | null {
  try {
    return new URL(url).pathname.replace(/^\/+/, '') || null;
  } catch {
    return null;
  }
}

function collectReferencedPathnames(attachments: Record<string, any>): Set<string> {
  const refs = new Set<string>();
  for (const field of ATTACHMENT_FIELDS) {
    const value = attachments[field];
    const values = Array.isArray(value) ? value : [value];
    for (const item of values) {
      if (typeof item !== 'string' || !item) continue;
      const pathname = toPathname(item);
      if (pathname) refs.add(pathname);
    }
  }
  return refs;
}

function policyDays(status: string): number | null {
  const key = POLICY_ENV[status];
  if (!key) return null;
  const raw = process.env[key];
  if (!raw) return null;
  const days = Number(raw);
  return Number.isFinite(days) && days > 0 ? Math.floor(days) : null;
}

function ageDays(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / 86_400_000);
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);

    const applications = await prisma.talentApplication.findMany({
      select: {
        id: true,
        applicationNumber: true,
        status: true,
        attachments: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { applicationNumber: 'asc' },
    });

    const referenced = new Set<string>();
    const retentionCandidates: Array<{
      id: string;
      applicationNumber: string;
      status: string;
      ageDays: number;
      policyDays: number;
    }> = [];

    let legalHoldCount = 0;

    for (const application of applications) {
      const attachments = parseJson(application.attachments);
      const refs = collectReferencedPathnames(attachments);
      refs.forEach((pathname) => referenced.add(pathname));

      const workflow = attachments._workflow && typeof attachments._workflow === 'object'
        ? attachments._workflow
        : {};
      const legalHold = workflow.legalHold === true;
      if (legalHold) legalHoldCount += 1;

      const policy = policyDays(application.status);
      const age = ageDays(application.updatedAt || application.createdAt);
      if (policy !== null && age >= policy && !legalHold) {
        retentionCandidates.push({
          id: application.id,
          applicationNumber: application.applicationNumber,
          status: application.status,
          ageDays: age,
          policyDays: policy,
        });
      }
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const orphanCandidates: Array<{ pathname: string; size: number; ageDays: number; ageHours: number; stable: boolean }> = [];
    let scanned = 0;
    let truncated = false;

    if (token) {
      let cursor: string | undefined;
      let hasMore = true;

      while (hasMore) {
        const result = await list({
          prefix: 'talents/',
          cursor,
          limit: 1000,
          token,
        });

        for (const blob of result.blobs) {
          scanned += 1;
          if (!referenced.has(blob.pathname)) {
            const ageHours = Math.max(0, Math.floor((Date.now() - blob.uploadedAt.getTime()) / 3_600_000));
            orphanCandidates.push({
              pathname: blob.pathname,
              size: blob.size || 0,
              ageDays: ageDays(blob.uploadedAt),
              ageHours,
              stable: ageHours >= ORPHAN_GRACE_HOURS,
            });
          }

          if (scanned >= 5000) {
            truncated = true;
            hasMore = false;
            break;
          }
        }

        if (!truncated) {
          hasMore = result.hasMore;
          cursor = result.cursor;
        }
      }
    }

    const policy = Object.fromEntries(
      Object.entries(POLICY_ENV).map(([status, key]) => [status, {
        env: key,
        days: policyDays(status),
      }])
    );

    const canonicalPlan = JSON.stringify({
      policy,
      retentionCandidates: retentionCandidates.map((item) => ({
        id: item.id,
        applicationNumber: item.applicationNumber,
        status: item.status,
        policyDays: item.policyDays,
      })),
      orphanCandidates: orphanCandidates.filter((item) => item.stable).map((item) => ({
        pathname: item.pathname,
        size: item.size,
      })),
      legalHoldCount,
      truncated,
    });

    const planHash = crypto.createHash('sha256').update(canonicalPlan).digest('hex');

    const response = NextResponse.json({
      success: true,
      mode: 'dry_run',
      executionAvailable: false,
      generatedAt: new Date().toISOString(),
      planHash,
      policyConfigured: Object.values(policy).some((item: any) => item.days !== null),
      policy,
      legalHoldCount,
      retention: {
        candidateCount: retentionCandidates.length,
        candidates: retentionCandidates.slice(0, 500),
      },
      orphanBlobs: {
        tokenConfigured: Boolean(token),
        scanned,
        candidateCount: orphanCandidates.filter((item) => item.stable).length,
        candidateBytes: orphanCandidates.filter((item) => item.stable).reduce((sum, item) => sum + item.size, 0),
        observedCount: orphanCandidates.length,
        recentCount: orphanCandidates.filter((item) => !item.stable).length,
        graceHours: ORPHAN_GRACE_HOURS,
        truncated,
        candidates: orphanCandidates.filter((item) => item.stable).slice(0, 500),
      },
      guardrails: {
        deletionEndpointExists: false,
        legalHoldExcluded: true,
        blobScope: 'talents/',
        maxBlobScan: 5000,
        orphanGraceHours: ORPHAN_GRACE_HOURS,
        recentOrphansExcluded: true,
      },
    });

    response.headers.set('Cache-Control', 'no-store, private');
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
    }
    console.error('Data lifecycle dry run error:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, message: 'تعذر إنشاء خطة Dry Run.' },
      { status: 500 }
    );
  }
}
