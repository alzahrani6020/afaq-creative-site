export const dynamic = 'force-dynamic';

import { createSign } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, UnauthorizedError } from '@/lib/admin-auth';

type RangeKey = 'today' | '7d' | '30d' | '90d' | 'custom';

class GoogleApiError extends Error {
  stage: 'oauth' | 'ga4';
  httpStatus: number;
  googleStatus?: string;
  googleCode?: number;

  constructor(args: {
    stage: 'oauth' | 'ga4';
    httpStatus: number;
    message: string;
    googleStatus?: string;
    googleCode?: number;
  }) {
    super(args.message);
    this.name = 'GoogleApiError';
    this.stage = args.stage;
    this.httpStatus = args.httpStatus;
    this.googleStatus = args.googleStatus;
    this.googleCode = args.googleCode;
  }
}

function base64Url(input: string) {
  return Buffer.from(input).toString('base64url');
}

function normalizePrivateKey(value: string) {
  return value.replace(/\\n/g, '\n');
}

function safeGoogleMessage(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback;
  return value.replace(/[\r\n\t]+/g, ' ').slice(0, 500);
}

function parseIsoDate(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null;
  return date;
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function rangeConfig(range: RangeKey, startDate: string | null, endDate: string | null) {
  if (range === 'today') {
    return {
      label: 'اليوم',
      current: { startDate: 'today', endDate: 'today' },
      previous: { startDate: 'yesterday', endDate: 'yesterday' },
    };
  }
  if (range === 'custom') {
    const start = parseIsoDate(startDate);
    const end = parseIsoDate(endDate);
    if (!start || !end || start > end) return null;

    const dayMs = 24 * 60 * 60 * 1000;
    const days = Math.floor((end.getTime() - start.getTime()) / dayMs) + 1;
    if (days < 1 || days > 366) return null;

    const previousEnd = new Date(start.getTime() - dayMs);
    const previousStart = new Date(previousEnd.getTime() - (days - 1) * dayMs);

    return {
      label: `من ${isoDate(start)} إلى ${isoDate(end)}`,
      current: { startDate: isoDate(start), endDate: isoDate(end) },
      previous: { startDate: isoDate(previousStart), endDate: isoDate(previousEnd) },
    };
  }
  if (range === '7d') {
    return {
      label: 'آخر 7 أيام',
      current: { startDate: '6daysAgo', endDate: 'today' },
      previous: { startDate: '13daysAgo', endDate: '7daysAgo' },
    };
  }
  if (range === '90d') {
    return {
      label: 'آخر 90 يومًا',
      current: { startDate: '89daysAgo', endDate: 'today' },
      previous: { startDate: '179daysAgo', endDate: '90daysAgo' },
    };
  }
  return {
    label: 'آخر 30 يومًا',
    current: { startDate: '29daysAgo', endDate: 'today' },
    previous: { startDate: '59daysAgo', endDate: '30daysAgo' },
  };
}

function combineDimensionFilters(
  ...filters: Array<Record<string, unknown> | null>
): Record<string, unknown> | undefined {
  const expressions = filters.filter(Boolean) as Array<Record<string, unknown>>;
  if (!expressions.length) return undefined;
  if (expressions.length === 1) return expressions[0];
  return { andGroup: { expressions } };
}

async function getAccessToken(email: string, privateKey: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64Url(JSON.stringify({
    iss: email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${claims}`;

  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(normalizePrivateKey(privateKey)).toString('base64url');
  const assertion = `${unsigned}.${signature}`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
    cache: 'no-store',
  });

  const tokenJson = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || !tokenJson.access_token) {
    throw new GoogleApiError({
      stage: 'oauth',
      httpStatus: tokenResponse.status,
      googleStatus: typeof tokenJson?.error === 'string' ? tokenJson.error : undefined,
      message: safeGoogleMessage(tokenJson?.error_description, 'Google OAuth token request failed.'),
    });
  }
  return tokenJson.access_token as string;
}

async function runReport(
  propertyId: string,
  accessToken: string,
  body: Record<string, unknown>
) {
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propertyId)}:runReport`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    }
  );

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new GoogleApiError({
      stage: 'ga4',
      httpStatus: response.status,
      googleStatus: typeof json?.error?.status === 'string' ? json.error.status : undefined,
      googleCode: typeof json?.error?.code === 'number' ? json.error.code : undefined,
      message: safeGoogleMessage(json?.error?.message, 'Google Analytics Data API request failed.'),
    });
  }
  return json;
}

function numberValue(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function metricMap(report: any) {
  const names = (report.metricHeaders || []).map((item: { name: string }) => item.name);
  const values = report.rows?.[0]?.metricValues || [];
  const metrics: Record<string, number> = {};
  names.forEach((name: string, index: number) => {
    metrics[name] = numberValue(values[index]?.value);
  });
  return metrics;
}

function rows(report: any) {
  const dimensions = (report.dimensionHeaders || []).map((item: { name: string }) => item.name);
  const metrics = (report.metricHeaders || []).map((item: { name: string }) => item.name);
  return (report.rows || []).map((row: any) => {
    const item: Record<string, string | number> = {};
    dimensions.forEach((name: string, index: number) => {
      item[name] = row.dimensionValues?.[index]?.value || '';
    });
    metrics.forEach((name: string, index: number) => {
      item[name] = numberValue(row.metricValues?.[index]?.value);
    });
    return item;
  });
}

function delta(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : null;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function buildInsights(
  current: Record<string, number>,
  previous: Record<string, number>,
  sourceRows: Array<Record<string, string | number>>,
  countryRows: Array<Record<string, string | number>>
) {
  const insights: string[] = [];
  const sessionDelta = delta(current.sessions || 0, previous.sessions || 0);
  const userDelta = delta(current.activeUsers || 0, previous.activeUsers || 0);
  const keyDelta = delta(current.keyEvents || 0, previous.keyEvents || 0);

  if (sessionDelta !== null) {
    insights.push(
      sessionDelta >= 0
        ? `الجلسات ارتفعت ${Math.abs(sessionDelta)}% مقارنة بالفترة السابقة.`
        : `الجلسات انخفضت ${Math.abs(sessionDelta)}% مقارنة بالفترة السابقة.`
    );
  }
  if (userDelta !== null) {
    insights.push(
      userDelta >= 0
        ? `المستخدمون النشطون ارتفعوا ${Math.abs(userDelta)}%.`
        : `المستخدمون النشطون انخفضوا ${Math.abs(userDelta)}%.`
    );
  }
  if (keyDelta !== null && (current.keyEvents || previous.keyEvents)) {
    insights.push(
      keyDelta >= 0
        ? `الأحداث الرئيسية ارتفعت ${Math.abs(keyDelta)}%.`
        : `الأحداث الرئيسية انخفضت ${Math.abs(keyDelta)}%.`
    );
  }

  const topSource = sourceRows[0];
  if (topSource?.sessionSourceMedium) {
    insights.push(
      `أعلى مصدر زيارات هو ${topSource.sessionSourceMedium} بعدد ${topSource.sessions || 0} جلسة.`
    );
  }

  const topCountry = countryRows[0];
  if (topCountry?.country) {
    insights.push(
      `أعلى دولة من حيث الجلسات هي ${topCountry.country} بعدد ${topCountry.sessions || 0} جلسة.`
    );
  }

  return insights.slice(0, 5);
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const propertyId = process.env.GA4_PROPERTY_ID;
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

    if (!propertyId || !email || !privateKey) {
      return NextResponse.json(
        { success: false, code: 'GA4_NOT_CONFIGURED', message: 'إعدادات Google Analytics Data API غير مكتملة.' },
        { status: 503 }
      );
    }

    const params = new URL(req.url).searchParams;
    const requestedRange = params.get('range');
    const range: RangeKey =
      requestedRange === 'today' ||
      requestedRange === '7d' ||
      requestedRange === '90d' ||
      requestedRange === 'custom'
        ? requestedRange
        : '30d';
    const config = rangeConfig(range, params.get('startDate'), params.get('endDate'));
    if (!config) {
      return NextResponse.json(
        {
          success: false,
          code: 'INVALID_ANALYTICS_RANGE',
          message: 'الفترة المخصصة غير صالحة. استخدم تاريخ بداية ونهاية صحيحين وبحد أقصى 366 يومًا.',
        },
        { status: 400 }
      );
    }

    const requestedCountry = params.get('country')?.trim() || '';
    const country = requestedCountry && requestedCountry !== 'ALL' ? requestedCountry.slice(0, 100) : null;
    const countryFilter: Record<string, unknown> | null = country
      ? {
          filter: {
            fieldName: 'country',
            stringFilter: {
              matchType: 'EXACT',
              value: country,
              caseSensitive: false,
            },
          },
        }
      : null;

    const accessToken = await getAccessToken(email, privateKey);

    const baseMetrics = [
      { name: 'activeUsers' },
      { name: 'sessions' },
      { name: 'screenPageViews' },
      { name: 'engagedSessions' },
      { name: 'engagementRate' },
      { name: 'averageSessionDuration' },
      { name: 'eventCount' },
      { name: 'keyEvents' },
    ];

    const [
      currentReport,
      previousReport,
      trendReport,
      sourceReport,
      locationReport,
      deviceReport,
      pageReport,
      visitorReport,
      hourReport,
      funnelReport,
    ] = await Promise.all([
      runReport(propertyId, accessToken, {
        dateRanges: [config.current],
        ...(countryFilter ? { dimensionFilter: countryFilter } : {}),
        metrics: baseMetrics,
      }),
      runReport(propertyId, accessToken, {
        dateRanges: [config.previous],
        ...(countryFilter ? { dimensionFilter: countryFilter } : {}),
        metrics: baseMetrics,
      }),
      runReport(propertyId, accessToken, {
        dateRanges: [config.current],
        ...(countryFilter ? { dimensionFilter: countryFilter } : {}),
        dimensions: [{ name: 'date' }],
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' },
          { name: 'screenPageViews' },
          { name: 'keyEvents' },
        ],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
        limit: 100,
      }),
      runReport(propertyId, accessToken, {
        dateRanges: [config.current],
        ...(countryFilter ? { dimensionFilter: countryFilter } : {}),
        dimensions: [{ name: 'sessionSourceMedium' }],
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' },
          { name: 'engagementRate' },
          { name: 'keyEvents' },
        ],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 10,
      }),
      runReport(propertyId, accessToken, {
        dateRanges: [config.current],
        ...(countryFilter ? { dimensionFilter: countryFilter } : {}),
        dimensions: [{ name: 'country' }, { name: 'city' }],
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' },
          { name: 'engagementRate' },
          { name: 'keyEvents' },
        ],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 15,
      }),
      runReport(propertyId, accessToken, {
        dateRanges: [config.current],
        ...(countryFilter ? { dimensionFilter: countryFilter } : {}),
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' },
          { name: 'engagementRate' },
        ],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 10,
      }),
      runReport(propertyId, accessToken, {
        dateRanges: [config.current],
        ...(countryFilter ? { dimensionFilter: countryFilter } : {}),
        dimensions: [{ name: 'pageTitle' }, { name: 'pagePath' }],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'activeUsers' },
          { name: 'engagementRate' },
        ],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 10,
      }),
      runReport(propertyId, accessToken, {
        dateRanges: [config.current],
        ...(countryFilter ? { dimensionFilter: countryFilter } : {}),
        dimensions: [{ name: 'newVsReturning' }],
        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 10,
      }),
      runReport(propertyId, accessToken, {
        dateRanges: [config.current],
        ...(countryFilter ? { dimensionFilter: countryFilter } : {}),
        dimensions: [{ name: 'hour' }],
        metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 24,
      }),
      runReport(propertyId, accessToken, {
        dateRanges: [config.current],
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }, { name: 'activeUsers' }],
        dimensionFilter: combineDimensionFilters(countryFilter, {
          filter: {
            fieldName: 'eventName',
            inListFilter: {
              values: ['talent_form_start', 'talent_form_step', 'talent_application_submit'],
            },
          },
        }),
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        limit: 10,
      }),
    ]);

    const current = metricMap(currentReport);
    const previous = metricMap(previousReport);
    const sourceRows = rows(sourceReport);
    const locationRows = rows(locationReport);

    const comparisons = Object.fromEntries(
      Object.keys(current).map((key) => [
        key,
        {
          current: current[key] || 0,
          previous: previous[key] || 0,
          changePercent: delta(current[key] || 0, previous[key] || 0),
        },
      ])
    );

    return NextResponse.json({
      success: true,
      range,
      rangeLabel: config.label,
      countryFilter: country,
      period: config.current,
      previousPeriod: config.previous,
      metrics: current,
      previousMetrics: previous,
      comparisons,
      trend: rows(trendReport),
      acquisition: sourceRows,
      locations: locationRows,
      devices: rows(deviceReport),
      pages: rows(pageReport),
      visitors: rows(visitorReport),
      peakHours: rows(hourReport),
      funnel: rows(funnelReport),
      executiveSummary: buildInsights(current, previous, sourceRows, locationRows),
      health: {
        dataApi: 'connected',
        propertyIdConfigured: true,
        serviceAccountConfigured: true,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
    }

    if (error instanceof GoogleApiError) {
      const diagnostic = {
        stage: error.stage,
        httpStatus: error.httpStatus,
        googleStatus: error.googleStatus || null,
        googleCode: error.googleCode || null,
        message: error.message,
      };

      console.error('GA4_DATA_API_ERROR', diagnostic);

      const status = error.httpStatus === 403 ? 403 : error.httpStatus === 400 ? 400 : 502;
      return NextResponse.json(
        {
          success: false,
          code: 'GA4_DATA_API_ERROR',
          diagnostic,
          message: `تعذر قراءة بيانات Google Analytics: ${error.message}`,
        },
        { status }
      );
    }

    console.error('GA4_DATA_API_ERROR', {
      stage: 'unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { success: false, code: 'GA4_REPORT_FAILED', message: 'تعذر قراءة بيانات Google Analytics.' },
      { status: 502 }
    );
  }
}
