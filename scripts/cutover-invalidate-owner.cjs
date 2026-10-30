/**
 * Cutover final security step: invalidate the leaked neondb_owner credential.
 * 1) POST reset_password (new password captured silently, discarded — owner not needed at runtime).
 * 2) Verify the OLD credential fails with 28P01 (reconstructed from pre-rotation parts, never printed).
 * Prints verdicts only. Run ONLY after smoke tests pass on the new app role.
 */
const fs = require('fs');

const PROJECT = 'still-flower-29846906';
const BRANCH = 'br-steep-cherry-ayr0f5du';
const OLD_B64 = process.env.OLD_PASS_B64; // base64 of the pre-rotation owner password (env, transient)

(async () => {
  if (!OLD_B64) { console.log(JSON.stringify({ ERROR: 'OLD_PASS_B64 not set' })); process.exit(2); }
  const cred = JSON.parse(fs.readFileSync(process.env.USERPROFILE + '/.config/neon/credentials.json', 'utf8'));
  const tok = cred.access_token;
  const base = 'https://console.neon.tech/api/v2/projects/' + PROJECT + '/branches/' + BRANCH;
  const log = {};

  // 1. reset owner password
  const res = await fetch(base + '/roles/neondb_owner/reset_password', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' },
    body: '{}',
  });
  log.RESET_HTTP = res.status;
  if (!res.ok) { console.log(JSON.stringify({ ...log, ERROR: 'reset failed' })); process.exit(1); }
  const body = await res.json(); // contains new password — intentionally NOT printed, NOT stored
  log.RESET_RETURNED_PASSWORD = body && (body.password || (body.role && body.role.password)) ? 'YES (discarded)' : 'CHECK';

  // 2. verify old credential is dead (expect 28P01 invalid_password)
  const oldPass = Buffer.from(OLD_B64, 'base64').toString('utf8');
  const oldUrl = 'postgresql://neondb_owner:' + encodeURIComponent(oldPass) +
    '@ep-steep-morning-ay7qonw8.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require';
  const { Client } = require('pg');
  const c = new Client({ connectionString: oldUrl, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });
  let code = 'CONNECTED(!)';
  try { await c.connect(); } catch (e) { code = e.code || 'ERR'; }
  try { await c.end(); } catch {}
  log.OLD_CREDENTIAL_RESULT = code;
  log.OLD_CREDENTIAL_INVALIDATED = code === '28P01' ? 'YES' : 'NO';
  console.log(JSON.stringify(log, null, 1));
  process.exit(code === '28P01' ? 0 : 1);
})().catch((e) => { console.log(JSON.stringify({ ERROR: e.message })); process.exit(1); });
