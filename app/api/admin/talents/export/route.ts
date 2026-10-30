export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
type ApplicationStatus = 'new' | 'under_review' | 'qualified' | 'need_information' | 'contacted' | 'accepted' | 'rejected';
const ApplicationStatusValues = ['new', 'under_review', 'qualified', 'need_information', 'contacted', 'accepted', 'rejected'] as const;
import { requireAdmin, UnauthorizedError } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

const FORMULA_TRIGGERS = /^[=+\-@\r\n'"]/;

function sanitizeCsvCell(value: string): string {
  const str = String(value ?? '');
  // Neutralize formula injection and force Excel to treat as text.
  let safe = str;
  if (FORMULA_TRIGGERS.test(safe)) {
    safe = '\t' + safe;
  }
  // Quote cells containing CSV metacharacters.
  if (/[",\n\r]/.test(safe)) {
    safe = `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

function formatPhone(value: string): string {
  // Prefix with tab so Excel/libreOffice treat it as text and preserve the leading +.
  const str = String(value ?? '').trim();
  if (!str) return '';
  return sanitizeCsvCell('\t' + str);
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as ApplicationStatus | null;

    const where: any = {};
    if (status && ApplicationStatusValues.includes(status as typeof ApplicationStatusValues[number])) {
      where.status = status;
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
      'الحالة',
      'الملاحظات الإدارية',
      'تاريخ التقديم',
    ];

    const rows = talents.map((t) => {
      let personal: any = {};
      let fieldList: string[] = [];
      let specializedEntries: string[] = [];
      try {
        personal = JSON.parse(t.personal || '{}');
      } catch {}
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
        t.status,
        t.adminNotes || '',
        t.createdAt.toISOString(),
      ];
    });

    const csvBody = [headers, ...rows]
      .map((row, rowIndex) =>
        row
          .map((cell, colIndex) => {
            // Phone column gets special treatment to preserve leading + and avoid scientific notation.
            if (rowIndex > 0 && colIndex === 5) {
              return formatPhone(cell);
            }
            return sanitizeCsvCell(cell);
          })
          .join(',')
      )
      .join('\n');

    // BOM helps Excel recognize UTF-8 Arabic content.
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
