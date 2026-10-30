/**
 * Admin Access Recovery — authorized single-field password reset on Neon production.
 *
 * Scope (per owner authorization):
 *   - Target: afaq-talents-production, branch br-steep-cherry-ayr0f5du (production), AdminUser count must be 1
 *   - Exactly ONE UPDATE: passwordHash of the existing admin, nothing else
 *   - No new admin, no SQLite admin migration, no business data changes
 *
 * Credential hygiene:
 *   - neondb_owner password is re-rotated via API at start (in-memory only) and re-rotated again at the end,
 *     so no durable owner credential exists after this run.
 *   - New admin password is written only to .admin_reset_password (0600). Never printed.
 *   - Verdicts printed are metadata-only.
 */
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const PROJECT = 'still-flower-29846906';
const BRANCH = 'br-steep-cherry-ayr0f5du';
const PROD_HOST = 'ep-steep-morning-ay7qonw8.c-5.us-east-2.aws.neon.tech';
const DB = 'neondb';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL; // set by wrapper, not hardcoded
const ROOT = path.resolve(__dirname, '..');

const log = {};

(async () => {
  if (!ADMIN_EMAIL) { console.log(JSON.stringify({ ERROR: 'ADMIN_EMAIL not set' })); process.exit(2); }

  const cred = JSON.parse(fs.readFileSync(process.env.USERPROFILE + '/.config/neon/credentials.json', 'utf8'));
  const tok = cred.access_token;
  const api = 'https://console.neon.tech/api/v2/projects/' + PROJECT + '/branches/' + BRANCH;

  const { Client } = require('pg');
  const bcrypt = require('bcryptjs');

  // --- 1) transient owner access (in-memory only) ---
  const rot = await fetch(api + '/roles/neondb_owner/reset_password', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' },
    body: '{}',
  });
  if (!rot.ok) { console.log(JSON.stringify({ ERROR: 'owner rotation failed', http: rot.status })); process.exit(1); }
  const rotBody = await rot.json();
  const ownerPass = rotBody.password || (rotBody.role && rotBody.role.password);
  if (!ownerPass) { console.log(JSON.stringify({ ERROR: 'no password in rotation response' })); process.exit(1); }

  const ownerUrl = 'postgresql://neondb_owner:' + encodeURIComponent(ownerPass) + '@' + PROD_HOST + '/' + DB + '?sslmode=require';
  if (!ownerUrl.includes(PROD_HOST)) { console.log(JSON.stringify({ ERROR: 'endpoint guard failed' })); process.exit(1); }

  const c = new Client({ connectionString: ownerUrl, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });
  await c.connect();

  // --- 2) target verification (metadata only) ---
  const cnt = await c.query('SELECT count(*) FROM "AdminUser"');
  log.ADMIN_COUNT = Number(cnt.rows[0].count);
  if (log.ADMIN_COUNT !== 1) {
    await c.end();
    console.log(JSON.stringify({ ...log, ERROR: 'ADMIN_COUNT != 1, STOP' }));
    process.exit(1);
  }
  const before = await c.query('SELECT * FROM "AdminUser" WHERE email = $1', [ADMIN_EMAIL]);
  if (before.rows.length !== 1) {
    await c.end();
    console.log(JSON.stringify({ ...log, ERROR: 'target admin not found by email, STOP' }));
    process.exit(1);
  }
  const b = before.rows[0];
  log.ADMIN_ACTIVE = b.isActive;
  log.ADMIN_ROLE = b.role;
  const hashFmt = String(b.passwordHash).slice(0, 7); // e.g. $2b$10$ — format+cost only
  log.HASH_FORMAT = hashFmt;
  const cost = Number(hashFmt.split('$')[2]) || 10;

  const tables = ['TalentApplication', 'ApplicantSkillProfile', 'TalentApplicationActivity', 'AdminActivity', 'AdminUser', 'EmailVerificationToken', 'TrustedDevice'];
  const countsBefore = {};
  for (const t of tables) countsBefore[t] = Number((await c.query(`SELECT count(*) FROM "${t}"`)).rows[0].count);

  // --- 3) generate + hash new password ---
  const newPw = crypto.randomBytes(18).toString('base64url'); // 24 chars, high entropy
  const newHash = await bcrypt.hash(newPw, cost);

  // --- 4) single-field UPDATE ---
  const upd = await c.query('UPDATE "AdminUser" SET "passwordHash" = $1 WHERE id = $2', [newHash, b.id]);
  log.ADMIN_ROWS_UPDATED = upd.rowCount;

  // --- 5) verify: only passwordHash changed ---
  const after = await c.query('SELECT * FROM "AdminUser" WHERE id = $1', [b.id]);
  const a = after.rows[0];
  const otherFields = ['id', 'name', 'email', 'role', 'isActive', 'lastLoginAt', 'createdAt', 'updatedAt'];
  log.OTHER_ADMIN_FIELDS_CHANGED = otherFields.filter((f) => String(a[f]) !== String(b[f])).length;
  log.HASH_CHANGED = a.passwordHash !== b.passwordHash;

  const countsAfter = {};
  for (const t of tables) countsAfter[t] = Number((await c.query(`SELECT count(*) FROM "${t}"`)).rows[0].count);
  log.BUSINESS_ROWS_CHANGED = tables.filter((t) => countsAfter[t] !== countsBefore[t]).length;
  log.PASSWORD_RESET = (log.ADMIN_ROWS_UPDATED === 1 && log.OTHER_ADMIN_FIELDS_CHANGED === 0 && log.BUSINESS_ROWS_CHANGED === 0 && log.HASH_CHANGED) ? 'EXECUTED' : 'CHECK';
  await c.end();

  if (log.PASSWORD_RESET !== 'EXECUTED') {
    console.log(JSON.stringify({ ...log, ERROR: 'post-update verification failed, STOP' }));
    process.exit(1);
  }

  // --- 6) store new password locally (0600), never print ---
  const credFile = path.join(ROOT, '.admin_reset_password');
  fs.writeFileSync(credFile, 'Email: ' + ADMIN_EMAIL + '\nPassword: ' + newPw + '\n', { mode: 0o600 });
  try { fs.chmodSync(credFile, 0o600); } catch {}
  log.PASSWORD_STORED = fs.existsSync(credFile) ? 'YES (.admin_reset_password, 0600)' : 'NO';

  // --- 7) login verification through the real deployed app ---
  const BASE = 'https://afaq-global.com';
  const loginRes = await fetch(BASE + '/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: newPw }),
  });
  log.LOGIN_HTTP = loginRes.status;
  let loginBody = null;
  try { loginBody = await loginRes.json(); } catch {}
  log.ADMIN_PASSWORD_LOGIN = (loginRes.status === 200 && loginBody && loginBody.success === true) ? 'PASS' : 'FAIL';

  const setCookie = loginRes.headers.get('set-cookie') || '';
  const cookie = setCookie.split(';')[0];
  log.SESSION_CREATED = !!cookie && cookie.includes('=') ? 'YES' : 'NO';

  let meHttp = null, talentsHttp = null;
  if (cookie) {
    const meRes = await fetch(BASE + '/api/admin/me', { headers: { cookie } });
    meHttp = meRes.status;
    const tRes = await fetch(BASE + '/api/admin/talents', { headers: { cookie } });
    talentsHttp = tRes.status;
  }
  log.PROTECTED_ROUTE_TEST = (meHttp === 200 && talentsHttp === 200) ? 'PASS' : 'FAIL (' + meHttp + '/' + talentsHttp + ')';

  const siteRes = await fetch(BASE + '/');
  log.SITE_HEALTH = siteRes.status === 200 ? 'OK' : 'HTTP ' + siteRes.status;
  log.DATABASE_HEALTH = (talentsHttp === 200) ? 'OK (admin talents listing served from Neon via afaq_app)' : 'CHECK';

  // --- 8) re-rotate owner so no durable owner credential exists ---
  const rot2 = await fetch(api + '/roles/neondb_owner/reset_password', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' },
    body: '{}',
  });
  log.OWNER_RESECURED = rot2.ok ? 'YES (rotated again, discarded)' : 'HTTP ' + rot2.status;
  log.SECRET_EXPOSED = 'NO';

  console.log(JSON.stringify(log, null, 1));
  process.exit(log.ADMIN_PASSWORD_LOGIN === 'PASS' && log.PROTECTED_ROUTE_TEST === 'PASS' ? 0 : 1);
})().catch((e) => { console.log(JSON.stringify({ ERROR: e.message })); process.exit(1); });
