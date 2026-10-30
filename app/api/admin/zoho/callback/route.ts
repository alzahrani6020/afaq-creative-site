import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getAccountsDomain(): string {
  return process.env.ZOHO_ACCOUNTS_DOMAIN || 'accounts.zoho.com';
}

function getMailApiDomain(): string {
  return process.env.ZOHO_MAIL_API_DOMAIN || 'mail.zoho.com';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildErrorHtml(message: string): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>فشل ربط Zoho Mail</title>
  <style>
    body { font-family: Arial, Tahoma, sans-serif; background: #0f172a; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; }
    .card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 40px; max-width: 640px; text-align: center; }
    h1 { color: #ef4444; font-size: 24px; margin-bottom: 16px; }
    p { color: rgba(255,255,255,0.7); line-height: 1.7; }
    code { background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px; font-size: 0.95em; }
  </style>
</head>
<body>
  <div class="card">
    <h1>فشل ربط Zoho Mail</h1>
    <p>${escapeHtml(message)}</p>
  </div>
</body>
</html>`;
}

function buildSuccessHtml({
  refreshToken,
  accountInfo,
  expiresIn,
}: {
  refreshToken: string;
  accountInfo: string;
  expiresIn: number;
}): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>تم ربط Zoho Mail</title>
  <style>
    body { font-family: Arial, Tahoma, sans-serif; background: #0f172a; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; }
    .card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 40px; max-width: 720px; width: 100%; }
    h1 { color: #22c55e; font-size: 24px; margin-bottom: 16px; }
    p, li { color: rgba(255,255,255,0.75); line-height: 1.8; }
    code { display: block; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1); padding: 12px; border-radius: 8px; word-break: break-all; direction: ltr; text-align: left; margin: 12px 0; font-size: 13px; }
    .label { color: rgba(255,255,255,0.5); font-size: 13px; margin-top: 16px; }
    .warn { color: #f59e0b; }
  </style>
</head>
<body>
  <div class="card">
    <h1>✓ تم ربط Zoho Mail بنجاح</h1>
    <p>تم استخراج <strong>Refresh Token</strong>. قم بنسخه وإضافته كمتغير بيئة على Vercel:</p>
    <div class="label">اسم المتغير:</div>
    <code>ZOHO_REFRESH_TOKEN</code>
    <div class="label">القيمة:</div>
    <code>${escapeHtml(refreshToken)}</code>
    ${accountInfo}
    <p class="warn">⚠️ احذف هذه الصفحة بعد نسخ القيمة ولا تشاركه مع أحد.</p>
    <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 24px 0;" />
    <p>بعد إضافة المتغير، قم بتعيين <code>EMAIL_PROVIDER=zoho</code> على Vercel ثم أعد النشر.</p>
    <p>مدة صلاحية Access Token الأولي: <strong>${expiresIn} ثانية</strong>.</p>
  </div>
</body>
</html>`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  if (error) {
    return new NextResponse(buildErrorHtml(`رفض Zoho التفويض: ${error}`), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  if (!code) {
    return new NextResponse(buildErrorHtml('لم يتم إرسال رمز التفويض (code) من Zoho.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const expectedState = process.env.ZOHO_OAUTH_STATE || 'afaq-zoho-setup';
  if (state !== expectedState) {
    return new NextResponse(buildErrorHtml('قيمة state غير متطابقة.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const redirectUri = process.env.ZOHO_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return new NextResponse(
      buildErrorHtml('لم يتم إعداد بيانات Zoho OAuth Client على الخادم (ZOHO_CLIENT_ID / ZOHO_CLIENT_SECRET / ZOHO_REDIRECT_URI).'),
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  try {
    const tokenUrl = new URL(`https://${getAccountsDomain()}/oauth/v2/token`);
    tokenUrl.searchParams.set('code', code);
    tokenUrl.searchParams.set('client_id', clientId);
    tokenUrl.searchParams.set('client_secret', clientSecret);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('grant_type', 'authorization_code');

    const tokenResp = await fetch(tokenUrl.toString(), { method: 'POST' });
    const tokenData = await tokenResp.json();

    if (!tokenResp.ok || tokenData.error) {
      const msg = tokenData.error || `HTTP ${tokenResp.status}`;
      return new NextResponse(buildErrorHtml(`فشل استبدال رمز التفويض: ${msg}`), {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    const { access_token, refresh_token, expires_in } = tokenData;

    if (!refresh_token) {
      return new NextResponse(
        buildErrorHtml('لم يتم إرجاع refresh token. تأكد من استخدام access_type=offline و prompt=consent.'),
        { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    // Try to fetch the account ID for convenience.
    let accountInfo = '';
    try {
      const accountsResp = await fetch(`https://${getMailApiDomain()}/api/accounts`, {
        headers: {
          Authorization: `Zoho-oauthtoken ${access_token}`,
          Accept: 'application/json',
        },
      });
      const accountsData = await accountsResp.json();
      const accounts = accountsData?.data;
      if (Array.isArray(accounts) && accounts.length > 0) {
        const primary = accounts.find((a: any) => a.primary) || accounts[0];
        accountInfo = `<div class="label">Account ID المقترح لـ ZOHO_ACCOUNT_ID:</div><code>${escapeHtml(String(primary.accountId))}</code>`;
      }
    } catch {
      // Account lookup is optional.
    }

    return new NextResponse(buildSuccessHtml({ refreshToken: refresh_token, accountInfo, expiresIn: expires_in || 0 }), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new NextResponse(buildErrorHtml(`حدث خطأ غير متوقع: ${message}`), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}
