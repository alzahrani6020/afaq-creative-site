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
    const parsed = new URL(url);
    return parsed.pathname.replace(/^\/+/, '') || null;
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

export async function GET(req: NextRequest) {
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
      orderBy: { createdAt: 'asc' },
    });

    const referenced = new Set<string>();
    const statusSummary: Record<string, { count: number; oldestAgeDays: number; policyDays: number | null; candidates: number }> = {};
    let legalHoldCount = 0;
    const retentionCandidates: Array<{
      id: string;
      applicationNumber: string;
      status: string;
      ageDays: number;
      policyDays: number;
      attachmentCount: number;
    }> = [];

    for (const application of applications) {
      const attachments = parseJson(application.attachments);
      const refs = collectReferencedPathnames(attachments);
      refs.forEach((pathname) => referenced.add(pathname));

      const workflow = attachments._workflow && typeof attachments._workflow === 'object'
        ? attachments._workflow
        : {};
      const legalHold = workflow.legalHold === true;
      if (legalHold) legalHoldCount += 1;

      const status = application.status;
      const age = ageDays(application.updatedAt || application.createdAt);
      const policy = policyDays(status);
      const summary = statusSummary[status] || {
        count: 0,
        oldestAgeDays: 0,
        policyDays: policy,
        candidates: 0,
      };
      summary.count += 1;
      summary.oldestAgeDays = Math.max(summary.oldestAgeDays, age);
      summary.policyDays = policy;

      if (policy !== null && age >= policy && !legalHold) {
        summary.candidates += 1;
        retentionCandidates.push({
          id: application.id,
          applicationNumber: application.applicationNumber,
          status,
          ageDays: age,
          policyDays: policy,
          attachmentCount: refs.size,
        });
      }
      statusSummary[status] = summary;
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    let blobCursor: string | undefined;
    let hasMore = true;
    let scanned = 0;
    let scannedBytes = 0;
    let truncated = false;
    const orphans: Array<{
      pathname: string;
      size: number;
      uploadedAt: string;
      url: string;
      ageDays: number;
      ageHours: number;
      stable: boolean;
    }> = [];

    if (token) {
      while (hasMore) {
        const result = await list({
          prefix: 'talents/',
          cursor: blobCursor,
          limit: 1000,
          token,
        });

        for (const blob of result.blobs) {
          scanned += 1;
          scannedBytes += blob.size || 0;
          if (!referenced.has(blob.pathname)) {
            const ageHours = Math.max(0, Math.floor((Date.now() - blob.uploadedAt.getTime()) / 3_600_000));
            orphans.push({
              pathname: blob.pathname,
              size: blob.size || 0,
              uploadedAt: blob.uploadedAt.toISOString(),
              url: blob.url,
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
          blobCursor = result.cursor;
        }
      }
    }

    const response = NextResponse.json({
      success: true,
      generatedAt: new Date().toISOString(),
      mode: 'report_only',
      deletionEnabled: false,
      retention: {
        policyConfigured: Object.values(statusSummary).some((item) => item.policyDays !== null),
        legalHoldCount,
        envKeys: POLICY_ENV,
        statusSummary,
        candidates: retentionCandidates.slice(0, 500),
        candidateCount: retentionCandidates.length,
      },
      orphanBlobs: {
        prefix: 'talents/',
        tokenConfigured: Boolean(token),
        scanned,
        scannedBytes,
        referencedCount: referenced.size,
        orphanCount: orphans.length,
        stableCount: orphans.filter((item) => item.stable).length,
        recentCount: orphans.filter((item) => !item.stable).length,
        graceHours: ORPHAN_GRACE_HOURS,
        truncated,
        candidates: orphans.slice(0, 500),
      },
    });

    response.headers.set('Cache-Control', 'no-store, private');
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
    }
    console.error('Data lifecycle report error:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: false, message: 'تعذر إنشاء تقرير دورة حياة البيانات.' },
      { status: 500 }
    );
  }
}
