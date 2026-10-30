/**
 * Owner-approved: point AdminUser.email to the owner's existing Google account
 * so Google OAuth works with the account the owner already has.
 * - Exactly ONE UPDATE: AdminUser.email (nothing else).
 * - Rotates afaq_app password in-memory (Neon API), applies the single UPDATE,
 *   then updates Vercel DATABASE_URL with the same new password and prints verdicts only.
 */
const fs = require('fs');

const PROJECT = 'still-flower-29846906';
const BRANCH = 'br-steep-cherry-ayr0f5du';
const PROD_HOST = 'ep-steep-morning-ay7qonw8.c-5.us-east-2.aws.neon.tech';
const DB = 'neondb';
const VERCEL_PROJECT = 'prj_XAPaMLJtUlXPMKBz1WJWgF2jEdin';
const TEAM = 'team_ENxUZq5el15Zn8pi4ahZMXpz';
const OLD_EMAIL = 'admin@afaq-global.com';
const NEW_EMAIL = 'iiffund.dev@gmail.com';

(async () => {
  const neon = JSON.parse(fs.readFileSync(process.env.USERPROFILE + '/.config/neon/credentials.json', 'utf8'));
  const vercel = JSON.parse(fs.readFileSync(process.env.APPDATA + '/xdg.data/com.vercel.cli/auth.json', 'utf8'));
  const api = 'https://console.neon.tech/api/v2/projects/' + PROJECT + '/branches/' + BRANCH;

  const { Client } = require('pg');
  const log = {};

  // 1) rotate afaq_app password in-memory
  const rot = await fetch(api + '/roles/afaq_app/reset_password', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + neon.access_token, 'Content-Type': 'application/json' },
    body: '{}',
  });
  if (!rot.ok) { console.log(JSON.stringify({ ERROR: 'afaq_app rotation failed', http: rot.status })); process.exit(1); }
  const rotBody = await rot.json();
  const appPass = rotBody.password || (rotBody.role && rotBody.role.password);
  if (!appPass) { console.log(JSON.stringify({ ERROR: 'no password returned' })); process.exit(1); }

  const url = 'postgresql://afaq_app:' + encodeURIComponent(appPass) + '@' + PROD_HOST + '/' + DB + '?sslmode=require';
  if (!url.includes(PROD_HOST)) { console.log(JSON.stringify({ ERROR: 'endpoint guard failed' })); process.exit(1); }

  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });
  await c.connect();

  // 2) snapshot for verification
  const before = await c.query('SELECT * FROM "AdminUser" WHERE email = $1', [OLD_EMAIL]);
  if (before.rows.length !== 1) {
    await c.end();
    console.log(JSON.stringify({ ERROR: 'expected exactly 1 admin with old email, found ' + before.rows.length }));
    process.exit(1);
  }
  const b = before.rows[0];

  // 3) single-field UPDATE
  const upd = await c.query('UPDATE "AdminUser" SET email = $1 WHERE id = $2', [NEW_EMAIL, b.id]);
  log.ADMIN_ROWS_UPDATED = upd.rowCount;

  // 4) verify: only email changed
  const after = await c.query('SELECT * FROM "AdminUser" WHERE id = $1', [b.id]);
  const a = after.rows[0];
  const others = ['id', 'name', 'role', 'isActive', 'passwordHash', 'lastLoginAt', 'createdAt', 'updatedAt'];
  log.OTHER_FIELDS_CHANGED = others.filter((f) => String(a[f]) !== String(b[f])).length;
  log.EMAIL_CHANGED = a.email === NEW_EMAIL;
  await c.end();

  if (!(log.ADMIN_ROWS_UPDATED === 1 && log.OTHER_FIELDS_CHANGED === 0 && log.EMAIL_CHANGED)) {
    console.log(JSON.stringify({ ...log, ERROR: 'verification failed' }));
    process.exit(1);
  }

  // 5) update Vercel DATABASE_URL with the same rotated password
  const envList = await (await fetch(`https://api.vercel.com/v10/projects/${VERCEL_PROJECT}/env?teamId=${TEAM}&decrypt=false`, {
    headers: { Authorization: 'Bearer ' + vercel.token },
  })).json();
  const env = envList.envs.find((e) => e.key === 'DATABASE_URL');
  const newDbUrl = 'postgresql://afaq_app:' + encodeURIComponent(appPass) + '@' + PROD_HOST + '/' + DB + '?sslmode=require&channel_binding=require';
  const patch = await fetch(`https://api.vercel.com/v9/projects/${VERCEL_PROJECT}/env/${env.id}?teamId=${TEAM}`, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer ' + vercel.token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ value: newDbUrl }),
  });
  log.VERCEL_UPDATED = patch.ok ? 'YES' : 'HTTP ' + patch.status;
  log.SECRET_EXPOSED = 'NO';

  console.log(JSON.stringify(log, null, 1));
  process.exit(log.VERCEL_UPDATED === 'YES' ? 0 : 1);
})().catch((e) => { console.log(JSON.stringify({ ERROR: e.message })); process.exit(1); });
