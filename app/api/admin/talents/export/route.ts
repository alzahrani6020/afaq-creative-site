export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
type ApplicationStatus = 'new' | 'under_review' | 'qualified' | 'need_information' | 'contacted' | 'accepted' | 'rejected';
const ApplicationStatusValues = ['new', 'under_review', 'qualified', 'need_information', 'contacted', 'accepted', 'rejected'] as const;
import { requireAdmin, UnauthorizedError } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { getCountry, getRegion } from '@/lib/catalog/locations';

const FORMULA_TRIGGERS = /^[=+\-@\r\n'"]/;

function sanitizeCsvCell(value: string): string {
  const str = String(value ?? '');
  let safe = str;
  if (FORMULA_TRIGGERS.test(safe)) safe = '\t' + safe;
  if (/[",\n\r]/.test(safe)) safe = `"${safe.replace(/"/g, '""')}"`;
  return safe;
}

function formatPhone(value: string): string {
  const str = String(value ?? '').trim();
  if (!str) return '';
  return sanitizeCsvCell('\t' + str);
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as ApplicationStatus | null;
    const search = searchParams.get('search')?.trim() || '';
    const country = searchParams.get('country')?.trim() || '';
    const region = searchParams.get('region')?.trim() || '';
    const city = searchParams.get('city')?.trim() || '';

    const where: any = {};
    if (status && ApplicationStatusValues.includes(status as typeof ApplicationStatusValues[number])) {
      where.status = status;
    }
    if (country && getCountry(country)) {
      where.country = country;
      if (region && getRegion(country, region)) {
        where.region = region;
        if (city) where.city = city;
      }
    }
    if (search) {
      where.OR = [
        { applicationNumber: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const talents = await prisma.talentApplication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'رقم الطلب',
      'الفئة',
      'المجالات',
      'التخصصات الفرعية',
      'الاسم',
      'رقم الجوال',
      'البريد الإلكتروني',
      'الدولة',
      'المنطقة',
      'المدينة',
      'الحالة',
      'الملاحظات الإدارية',
      'تاريخ التقديم',
    ];

    const rows = talents.map((t) => {
      let personal: any = {};
      let fieldList: string[] = [];
      let specializedEntries: string[] = [];
      try { personal = JSON.parse(t.personal || '{}'); } catch {}
      try {
        const parsed = JSON.parse(t.fields || '[]');
        fieldList = Array.isArray(parsed) ? parsed : String(parsed).split(',').map((f: string) => f.trim()).filter(Boolean);
      } catch {
        fieldList = String(t.fields || '').split(',').map((f) => f.trim()).filter(Boolean);
      }
      try {
        const parsed = JSON.parse(t.specialized || '{}');
        specializedEntries = Object.entries(parsed).map(([k, v]) => `${k}: ${String(v)}`);
      } catch {
        specializedEntries = [String(t.specialized || '')];
      }

      const fullName = personal.full_name || `${personal.firstName || ''} ${personal.lastName || ''}`.trim();

      return [
        t.applicationNumber,
        t.category,
        fieldList.join('، '),
        specializedEntries.join('؛ '),
        fullName,
        t.phone || '',
        t.email || '',
        t.country || '',
        t.region || '',
        t.city || '',
        t.status,
        t.adminNotes || '',
        t.createdAt.toISOString(),
      ];
    });

    const csvBody = [headers, ...rows]
      .map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          if (rowIndex > 0 && colIndex === 5) return formatPhone(cell);
          return sanitizeCsvCell(cell);
        }).join(',')
      )
      .join('\n');

    const csv = '\uFEFF' + csvBody;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="talents-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error('Admin talents export error:', message);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء التصدير.' },
      { status: 500 }
    );
  }
}
