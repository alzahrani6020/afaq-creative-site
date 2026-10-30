/**
 * Owner WhatsApp notify helpers.
 * Fail-soft: never throw to callers that must not break registration.
 */

export interface WhatsAppNotifyResult {
  success: boolean;
  provider?: 'cloud_api' | 'callmebot';
  error?: string;
}

export function normalizeWhatsAppNumber(input?: string | null): string {
  if (!input) return '';
  return input.replace(/[\s\-\(\)\.]/g, '').replace(/^\+/, '');
}

export function getWhatsAppNotifyTo(): string {
  return (
    normalizeWhatsAppNumber(process.env.WHATSAPP_NOTIFY_TO) ||
    normalizeWhatsAppNumber(process.env.WHATSAPP_NUMBER) ||
    normalizeWhatsAppNumber(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER) ||
    '966567566616'
  );
}

export function buildTalentAdminWhatsAppText(opts: {
  applicationNumber: string;
  name: string;
  profession: string;
  country?: string;
  city?: string;
  adminUrl: string;
}): string {
  const location = [opts.country, opts.city].filter(Boolean).join(' - ') || 'غير محدد';
  return [
    '🔔 طلب جديد في أفاق',
    `رقم الطلب: ${opts.applicationNumber}`,
    `الاسم: ${opts.name}`,
    `المهنة: ${opts.profession}`,
    `الموقع: ${location}`,
    `اللوحة: ${opts.adminUrl}`,
  ].join('\n');
}

async function sendViaCloudApi(to: string, text: string): Promise<WhatsAppNotifyResult> {
  const token = process.env.WHATSAPP_CLOUD_TOKEN || process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    return { success: false, error: 'WhatsApp Cloud API not configured' };
  }

  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { preview_url: true, body: text },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    return {
      success: false,
      provider: 'cloud_api',
      error: `Cloud API ${res.status}: ${body.slice(0, 240)}`,
    };
  }

  return { success: true, provider: 'cloud_api' };
}

async function sendViaCallMeBot(to: string, text: string): Promise<WhatsAppNotifyResult> {
  const apikey = process.env.WHATSAPP_CALLMEBOT_APIKEY;
  if (!apikey) {
    return { success: false, error: 'CallMeBot API key not configured' };
  }

  const url =
    'https://api.callmebot.com/whatsapp.php?' +
    new URLSearchParams({
      phone: `+${to}`,
      text,
      apikey,
    }).toString();

  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    return {
      success: false,
      provider: 'callmebot',
      error: `CallMeBot ${res.status}: ${body.slice(0, 240)}`,
    };
  }

  return { success: true, provider: 'callmebot' };
}

/**
 * Notify the owner WhatsApp number. Prefers Cloud API, then CallMeBot.
 */
export async function sendWhatsAppNotify(text: string, to?: string): Promise<WhatsAppNotifyResult> {
  const target = normalizeWhatsAppNumber(to) || getWhatsAppNotifyTo();
  if (!target) {
    return { success: false, error: 'No WhatsApp notify destination' };
  }

  const cloud = await sendViaCloudApi(target, text);
  if (cloud.success) return cloud;
  if (cloud.error && !cloud.error.includes('not configured')) {
    console.error('WhatsApp Cloud API notify failed:', cloud.error);
  }

  const bot = await sendViaCallMeBot(target, text);
  if (bot.success) return bot;
  if (bot.error && !bot.error.includes('not configured')) {
    console.error('CallMeBot notify failed:', bot.error);
  }

  return {
    success: false,
    error:
      cloud.error?.includes('not configured') && bot.error?.includes('not configured')
        ? 'No WhatsApp provider configured (set WHATSAPP_CLOUD_TOKEN + WHATSAPP_PHONE_NUMBER_ID, or WHATSAPP_CALLMEBOT_APIKEY)'
        : cloud.error || bot.error || 'WhatsApp notify failed',
  };
}
