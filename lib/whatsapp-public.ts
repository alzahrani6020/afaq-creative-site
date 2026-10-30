/** Client-safe WhatsApp number (digits only, no +). */
export function publicWhatsAppDigits(): string {
  const raw =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
    process.env.WHATSAPP_NUMBER ||
    '966567566616';
  return raw.replace(/[\s\-\(\)\.]/g, '').replace(/^\+/, '');
}

export function publicWhatsAppHref(text?: string): string {
  const n = publicWhatsAppDigits();
  if (!text) return `https://wa.me/${n}`;
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}
