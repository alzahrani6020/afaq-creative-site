import nodemailer from 'nodemailer';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  response?: string;
  error?: string;
}

export interface EmailConfig {
  provider: string | undefined;
  from: string;
  fromName: string;
}

export function getEmailConfig(): EmailConfig {
  return {
    provider: process.env.EMAIL_PROVIDER,
    from: process.env.EMAIL_FROM || 'info@bonds-global.com',
    fromName: process.env.EMAIL_FROM_NAME || 'AFAQ | آفاق',
  };
}

function getSmtpTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const secure = process.env.SMTP_SECURE !== 'false';

  if (!host || !user || !pass) {
    throw new Error(
      'SMTP configuration is incomplete. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD environment variables.'
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    logger: false,
    debug: false,
  });
}

export async function sendTransactionalEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const { provider, from, fromName } = getEmailConfig();

  if (!provider) {
    return {
      success: false,
      error: 'EMAIL_PROVIDER is not configured. Set EMAIL_PROVIDER to "smtp" and configure SMTP environment variables.',
    };
  }

  const fromAddress = `"${fromName}" <${from}>`;

  switch (provider.toLowerCase()) {
    case 'smtp': {
      try {
        const transport = getSmtpTransport();
        const info = await transport.sendMail({
          from: fromAddress,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
          replyTo: from,
        });
        return {
          success: true,
          messageId: info.messageId,
          response: typeof info.response === 'string' ? info.response : undefined,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { success: false, error: message };
      }
    }
    case 'zoho':
      try {
        await sendZohoEmail(options);
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { success: false, error: message };
      }
    case 'resend':
    case 'sendgrid':
    case 'mailgun':
    case 'postmark':
      return {
        success: false,
        error: `EMAIL_PROVIDER "${provider}" is not implemented. Supported providers: "smtp", "zoho".`,
      };
    default:
      return { success: false, error: `Unknown EMAIL_PROVIDER: ${provider}` };
  }
}

export function buildBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return 'https://afaq-global.com';
}

function getZohoAccountsDomain(): string {
  return process.env.ZOHO_ACCOUNTS_DOMAIN || 'accounts.zoho.com';
}

function getZohoMailApiDomain(): string {
  return process.env.ZOHO_MAIL_API_DOMAIN || 'mail.zoho.com';
}

async function refreshZohoAccessToken(): Promise<string> {
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Zoho OAuth configuration is incomplete. Set ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, and ZOHO_REFRESH_TOKEN.'
    );
  }

  const url = new URL(`https://${getZohoAccountsDomain()}/oauth/v2/token`);
  url.searchParams.set('refresh_token', refreshToken);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('client_secret', clientSecret);
  url.searchParams.set('grant_type', 'refresh_token');

  const resp = await fetch(url.toString(), { method: 'POST' });
  const data = await resp.json();

  if (!resp.ok || data.error) {
    const msg = data.error || `HTTP ${resp.status}`;
    throw new Error(`Zoho OAuth refresh failed: ${msg}`);
  }

  if (!data.access_token) {
    throw new Error('Zoho OAuth refresh response did not include access_token.');
  }

  return data.access_token;
}

async function sendZohoEmail(options: SendEmailOptions): Promise<void> {
  const accessToken = await refreshZohoAccessToken();
  const accountId = process.env.ZOHO_ACCOUNT_ID;
  const fromAddress = process.env.EMAIL_FROM || 'info@bonds-global.com';

  if (!accountId) {
    throw new Error('ZOHO_ACCOUNT_ID is not configured.');
  }

  const url = `https://${getZohoMailApiDomain()}/api/accounts/${accountId}/messages`;
  const isHtml = !!options.html;

  const payload = {
    fromAddress,
    toAddress: options.to,
    subject: options.subject,
    content: isHtml ? options.html : (options.text || ''),
    mailFormat: isHtml ? 'html' : 'plaintext',
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Zoho-oauthtoken ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await resp.json();

  if (!resp.ok || data?.status?.code !== 200) {
    throw new Error(`Zoho Mail API send failed: ${JSON.stringify(data)}`);
  }
}

export function buildAdminNotificationEmail({
  applicationNumber,
  name,
  profession,
  country,
  city,
  adminUrl,
}: {
  applicationNumber: string;
  name: string;
  profession: string;
  country?: string;
  city?: string;
  adminUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `طلب جديد في أفاق – ${applicationNumber}`;
  const location = [country, city].filter(Boolean).join(' - ') || 'غير محدد';
  const html = `
    <div dir="rtl" style="font-family: Arial, Tahoma, sans-serif; line-height: 1.7; color: #1a1a1a; max-width: 600px; margin: 0 auto;">
      <div style="background: #0f172a; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px;">أفاق</h1>
      </div>
      <div style="padding: 24px; background: #ffffff; border: 1px solid #e5e7eb;">
        <p style="font-size: 18px; margin-bottom: 16px;">تم استلام طلب جديد.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">رقم الطلب</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; direction: ltr;">${applicationNumber}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">الاسم</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${name}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">المهنة</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${profession}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">الموقع</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${location}</td></tr>
        </table>
        <div style="margin: 28px 0; text-align: center;">
          <a href="${adminUrl}" style="display: inline-block; padding: 12px 28px; background: #0ea5e9; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">فتح الطلب في لوحة الإدارة</a>
        </div>
      </div>
    </div>
  `;
  const text = `طلب جديد في أفاق – ${applicationNumber}\n\nالاسم: ${name}\nالمهنة: ${profession}\nالموقع: ${location}\n\nفتح الطلب: ${adminUrl}`;
  return { subject, html, text };
}

export function buildApplicationReceivedEmail({
  name,
  applicationNumber,
  verifyUrl,
}: {
  name: string;
  applicationNumber: string;
  verifyUrl?: string;
}): { subject: string; html: string; text: string } {
  const subject = `تم استلام طلبك في أفاق – ${applicationNumber}`;
  const html = `
    <div dir="rtl" style="font-family: Arial, Tahoma, sans-serif; line-height: 1.7; color: #1a1a1a; max-width: 600px; margin: 0 auto;">
      <div style="background: #0f172a; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px;">أفاق</h1>
      </div>
      <div style="padding: 24px; background: #ffffff; border: 1px solid #e5e7eb;">
        <p style="font-size: 18px; margin-bottom: 16px;">مرحبًا ${name}،</p>
        <p>تم استلام طلبك في منصة أفاق بنجاح.</p>
        <p style="font-size: 16px; margin: 24px 0;">
          <strong>رقم طلبك:</strong><br />
          <span style="font-size: 20px; font-weight: bold; color: #0ea5e9; direction: ltr; display: inline-block;">${applicationNumber}</span>
        </p>
        <p>احتفظ بهذا الرقم للرجوع إليه عند التواصل معنا.</p>
        ${verifyUrl ? `
        <div style="margin: 28px 0; text-align: center;">
          <a href="${verifyUrl}" style="display: inline-block; padding: 12px 28px; background: #0ea5e9; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">تأكيد البريد الإلكتروني</a>
        </div>
        ` : ''}
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 13px; color: #6b7280;">
          للتواصل: <a href="mailto:info@bonds-global.com" style="color: #0ea5e9;">info@bonds-global.com</a>
        </p>
      </div>
    </div>
  `;
  const text = `مرحبًا ${name}،\n\nتم استلام طلبك في منصة أفاق بنجاح.\nرقم طلبك: ${applicationNumber}\n\nاحتفظ بهذا الرقم للرجوع إليه عند التواصل معنا.\n\n${verifyUrl ? `لتأكيد بريدك الإلكتروني: ${verifyUrl}\n\n` : ''}للتواصل: info@bonds-global.com`;
  return { subject, html, text };
}

export function buildVerificationSuccessHtml(applicationNumber: string): string {
  return `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>تم تأكيد البريد الإلكتروني</title>
      <style>
        body { font-family: Arial, Tahoma, sans-serif; background: #0f172a; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
        .card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 40px; max-width: 480px; text-align: center; }
        h1 { color: #22c55e; font-size: 24px; margin-bottom: 16px; }
        p { color: rgba(255,255,255,0.7); line-height: 1.7; }
        .number { color: #f59e0b; font-size: 20px; font-weight: bold; margin: 12px 0; direction: ltr; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>تم تأكيد بريدك الإلكتروني بنجاح</h1>
        <p>رقم طلبك:</p>
        <div class="number">${applicationNumber}</div>
        <p>يمكنك الآن متابعة طلبك عند التواصل معنا.</p>
      </div>
    </body>
    </html>
  `;
}

export function buildVerificationErrorHtml(message: string): string {
  return `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>رابط غير صالح</title>
      <style>
        body { font-family: Arial, Tahoma, sans-serif; background: #0f172a; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
        .card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 40px; max-width: 480px; text-align: center; }
        h1 { color: #ef4444; font-size: 24px; margin-bottom: 16px; }
        p { color: rgba(255,255,255,0.7); line-height: 1.7; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>رابط غير صالح</h1>
        <p>${message}</p>
      </div>
    </body>
    </html>
  `;
}
