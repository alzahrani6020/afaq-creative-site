export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, UnauthorizedError } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

function hasReplacement(value: unknown): boolean {
  return typeof value === 'string' && value.includes('�');
}

function findBadPaths(value: unknown, prefix = ''): string[] {
  const out: string[] = [];
  if (typeof value === 'string') {
    if (value.includes('�')) out.push(prefix || '$');
    return out;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => out.push(...findBadPaths(item, `${prefix}[${index}]`)));
    return out;
  }
  if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      const next = prefix ? `${prefix}.${key}` : key;
      out.push(...findBadPaths(item, next));
    }
  }
  return out;
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const applications = await prisma.talentApplication.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        applicationNumber: true,
        category: true,
        fields: true,
        specialized: true,
        personal: true,
        country: true,
        region: true,
        city: true,
        adminNotes: true,
        createdAt: true,
        skillProfiles: {
          select: {
            id: true,
            profileType: true,
            sector: true,
            profession: true,
            specializations: true,
            services: true,
            description: true,
            customProfessionName: true,
            customProfessionLocalName: true,
            customProfessionDescription: true,
            customProfessionClosestSector: true,
          },
        },
      },
    });

    const suspects = applications.flatMap((app) => {
      const bad: string[] = [];

      for (const field of ['category','fields','specialized','personal','country','region','city','adminNotes'] as const) {
        const value = app[field];
        if (hasReplacement(value)) bad.push(field);
        if ((field === 'specialized' || field === 'personal' || field === 'fields') && typeof value === 'string') {
          try {
            const parsed = JSON.parse(value);
            bad.push(...findBadPaths(parsed, field));
          } catch {}
        }
      }

      app.skillProfiles.forEach((profile, index) => {
        const base = `skillProfiles[${index}]`;
        for (const [key, value] of Object.entries(profile)) {
          if (key === 'id') continue;
          if (hasReplacement(value)) bad.push(`${base}.${key}`);
          if (typeof value === 'string') {
            try {
              const parsed = JSON.parse(value);
              bad.push(...findBadPaths(parsed, `${base}.${key}`));
            } catch {}
          }
        }
      });

      const unique = Array.from(new Set(bad));
      if (!unique.length) return [];

      return [{
        applicationNumber: app.applicationNumber,
        createdAt: app.createdAt,
        badPaths: unique,
      }];
    });

    return NextResponse.json({
      success: true,
      scanned: applications.length,
      suspectCount: suspects.length,
      suspects,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
    }
    return NextResponse.json({
      success: false,
      code: 'TALENT_ENCODING_CHECK_FAILED',
      message: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
