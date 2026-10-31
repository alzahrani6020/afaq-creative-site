export const dynamic = 'force-dynamic';

import { createSign } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, UnauthorizedError } from '@/lib/admin-auth';

function base64Url(input: string) {
  return Buffer.from(input).toString('base64url');
}

function normalizePrivateKey(value: string) {
  return value.replace(/\\n/g, '\n');
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

  const tokenJson = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenJson.access_token) {
    throw new Error('GOOGLE_AUTH_FAILED');
  }
  return tokenJson.access_token as string;
}

async function runReport(propertyId: string, accessToken: string) {
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propertyId)}:runReport`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'engagedSessions' },
          { name: 'engagementRate' },
          { name: 'averageSessionDuration' },
          { name: 'eventCount' },
          { name: 'keyEvents' },
        ],
      }),
      cache: 'no-store',
    }
  );

  const json = await response.json();
  if (!response.ok) {
    const code = json?.error?.status || json?.error?.code || 'GA4_REPORT_FAILED';
    throw new Error(String(code));
  }
  return json;
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

    const accessToken = await getAccessToken(email, privateKey);
    const report = await runReport(propertyId, accessToken);

    const names = (report.metricHeaders || []).map((item: { name: string }) => item.name);
    const values = report.rows?.[0]?.metricValues || [];
    const metrics: Record<string, number> = {};

    names.forEach((name: string, index: number) => {
      const raw = values[index]?.value ?? '0';
      const parsed = Number(raw);
      metrics[name] = Number.isFinite(parsed) ? parsed : 0;
    });

    return NextResponse.json({
      success: true,
      period: { startDate: '30daysAgo', endDate: 'today' },
      metrics: {
        activeUsers: metrics.activeUsers || 0,
        sessions: metrics.sessions || 0,
        screenPageViews: metrics.screenPageViews || 0,
        engagedSessions: metrics.engagedSessions || 0,
        engagementRate: metrics.engagementRate || 0,
        averageSessionDuration: metrics.averageSessionDuration || 0,
        eventCount: metrics.eventCount || 0,
        keyEvents: metrics.keyEvents || 0,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
    }

    const code = error instanceof Error ? error.message : 'GA4_REPORT_FAILED';
    const status = code === 'PERMISSION_DENIED' ? 403 : 502;
    return NextResponse.json(
      { success: false, code, message: 'تعذر قراءة بيانات Google Analytics.' },
      { status }
    );
  }
}
