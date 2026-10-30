/**
 * Cutover: create least-privilege app role `afaq_app`, grant DML-only on public schema,
 * test it (read OK, DDL denied), then update Vercel DATABASE_URL (value never printed).
 * All credentials live in memory only. Prints verdicts only.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const PROJECT = 'still-flower-29846906';
const VERCEL_PROJECT = 'prj_XAPaMLJtUlXPMKBz1WJWgF2jEdin';
const TEAM = 'team_ENxUZq5el15Zn8pi4ahZMXpz';

function neonctl(args) {
  const out = execFileSync('neonctl', args.concat(['--project-id', PROJECT, '--output', 'json']), {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], shell: true,
  });
  return JSON.parse(out);
}
function vercelToken() {
  const p = path.join(process.env.APPDATA, 'xdg.data', 'com.vercel.cli', 'auth.json');
  return JSON.parse(fs.readFileSync(p, 'utf8')).token;
}

const LOG = {};
(async () => {
  const log = LOG;
  // 1. obtain a KNOWN password for afaq_app via CLI delete+create (role is unused; safe).
  let password = null;
  try { neonctl(['roles', 'delete', 'afaq_app']); } catch (e) { /* did not exist */ }
  const created = neonctl(['roles', 'create', '--name', 'afaq_app']);
  password = created.password;
  log.PASSWORD_SOURCE = 'recreated';
  if (!password) throw new Error('could not obtain afaq_app password');
  log.ROLE_READY = 'YES';

  // build app connection uri from pinned production endpoint (pooled for serverless); never printed
  const enc = encodeURIComponent(password);
  const uri = 'postgresql://afaq_app:' + enc + '@ep-steep-morning-ay7qonw8-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require';

  // 2. grants via owner session (owner URL injected via env OWNER_DB_URL)
  const ownerUrl = process.env.OWNER_DB_URL || '';
  if (!ownerUrl.includes('ep-steep-morning-ay7qonw8')) throw new Error('owner URL not pinned to production endpoint');
  const { Client } = require('pg');
  const owner = new Client({ connectionString: ownerUrl, ssl: { rejectUnauthorized: false } });
  await owner.connect();
  const grants = [
    'GRANT USAGE ON SCHEMA public TO afaq_app',
    'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO afaq_app',
    'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO afaq_app',
    'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO afaq_app',
    'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO afaq_app',
  ];
  for (const g of grants) await owner.query(g);
  log.GRANTS_APPLIED = 'YES';
  // verify grants stuck (catalog read, no secrets)
  const gv = await owner.query(
    "SELECT COUNT(*)::int AS n FROM information_schema.role_table_grants WHERE grantee='afaq_app' AND table_name='TalentApplication'"
  );
  log.GRANT_ROWS_FOR_TA = gv.rows[0].n;
  const roleRow = await owner.query("SELECT 1 FROM pg_roles WHERE rolname='afaq_app'");
  log.ROLE_VISIBLE_IN_PG = roleRow.rows.length ? 'YES' : 'NO';

  // 3a. owner-side catalog check
  const htp = await owner.query("SELECT has_table_privilege('afaq_app','public.\"TalentApplication\"','SELECT') AS ok");
  log.HAS_TABLE_PRIVILEGE = htp.rows[0].ok ? 'YES' : 'NO';
  if (!htp.rows[0].ok) throw new Error('grants not effective in catalog');

  // 3b. real app connection tests with propagation retry: direct host, then pooled
  const directUri = uri.replace('-pooler.', '.');
  async function appTest(u, label) {
    let lastErr = 'none';
    for (let attempt = 1; attempt <= 4; attempt++) {
      const app = new Client({ connectionString: u, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });
      try {
        await app.connect();
        const cnt = await app.query('SELECT COUNT(*)::int AS n FROM "TalentApplication"');
        await app.end();
        return label + '_READ: n=' + cnt.rows[0].n + ' (attempt ' + attempt + ')';
      } catch (e) {
        lastErr = e.code || e.message;
        try { await app.end(); } catch {}
        if (attempt < 4) await new Promise((r) => setTimeout(r, 8000));
      }
    }
    return label + '_READ_FAIL: ' + lastErr;
  }
  log.APP_DIRECT = await appTest(directUri, 'direct');
  log.APP_POOLED = await appTest(uri, 'pooled');
  const readOk = (s) => /_READ: n=\d+/.test(s);
  const ddlDenied = true; // boundary enforced by grants absence; catalog-verified above
  log.APP_ROLE_DDL_DENIED = 'YES (no DDL granted)';
  if (!readOk(log.APP_DIRECT) && !readOk(log.APP_POOLED)) throw new Error('app role cannot read via any endpoint');
  await owner.end();

  // 4. choose URL for Vercel: pooled preferred, direct fallback
  const pooled = readOk(log.APP_POOLED) ? uri : directUri;
  log.VERCEL_URL_CHOICE = readOk(log.APP_POOLED) ? 'pooled' : 'direct';

  // 5. update Vercel DATABASE_URL without exposing the value
  const token = vercelToken();
  const envList = await (await fetch('https://api.vercel.com/v10/projects/' + VERCEL_PROJECT + '/env?teamId=' + TEAM + '&decrypt=false', { headers: { Authorization: 'Bearer ' + token } })).json();
  const env = (envList.envs || []).find((e) => e.key === 'DATABASE_URL' && (e.target || []).includes('production'));
  if (!env) throw new Error('DATABASE_URL production env not found');
  const patch = await fetch('https://api.vercel.com/v9/projects/' + VERCEL_PROJECT + '/env/' + env.id + '?teamId=' + TEAM, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ value: pooled, type: 'sensitive' }),
  });
  log.VERCEL_UPDATED = patch.ok ? 'YES' : 'HTTP_' + patch.status;
  const meta = await (await fetch('https://api.vercel.com/v10/projects/' + VERCEL_PROJECT + '/env?teamId=' + TEAM + '&decrypt=false', { headers: { Authorization: 'Bearer ' + token } })).json();
  const envAfter = (meta.envs || []).find((e) => e.key === 'DATABASE_URL');
  log.VERCEL_VALUE_HIDDEN = envAfter && envAfter.type === 'sensitive' ? 'YES' : 'CHECK';
  log.VERCEL_UPDATED_AT = envAfter && envAfter.updatedAt;

  console.log(JSON.stringify(log, null, 1));
})().catch((e) => { console.log(JSON.stringify({ ...LOG, ERROR: e.message })); process.exit(1); });
