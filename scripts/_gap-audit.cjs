const fs = require('fs');
const path = require('path');
const root = 'C:/Users/vip/iif-fund-demo/afaq-creative';

function load(f) {
  const o = {};
  const p = path.join(root, f);
  if (!fs.existsSync(p)) return o;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    o[m[1]] = v;
  }
  return o;
}

const e = {
  ...load('.env'),
  ...load('.env.local'),
  ...load('.env.production.local'),
};

function shape(k) {
  const v = e[k];
  if (!v) return 'MISSING';
  let host = '';
  if (k === 'DATABASE_URL') {
    try {
      host = new URL(v).hostname;
    } catch {
      host = 'PARSE_FAIL';
    }
    return `set len=${v.length} host=${host}`;
  }
  return `set len=${v.length}`;
}

for (const k of [
  'WHATSAPP_NUMBER',
  'NEXT_PUBLIC_WHATSAPP_NUMBER',
  'WHATSAPP_NOTIFY_TO',
  'WHATSAPP_CLOUD_TOKEN',
  'WHATSAPP_PHONE_NUMBER_ID',
  'WHATSAPP_CALLMEBOT_APIKEY',
  'ADMIN_SESSION_SECRET',
  'DATABASE_URL',
  'GOOGLE_CLIENT_ID',
  'EMAIL_PROVIDER',
]) {
  console.log(k + ': ' + shape(k));
}

console.log(
  'sessionSecretTooShort:',
  e.ADMIN_SESSION_SECRET ? e.ADMIN_SESSION_SECRET.length < 32 : 'n/a'
);
console.log('local_login_dev_redirect_aic:', fs.readFileSync(path.join(root, 'app/admin/login/page.tsx'), 'utf8').includes("router.push('/admin/aic')"));
console.log('pages_dev_is_pywebcopy_mirror: check separately');
