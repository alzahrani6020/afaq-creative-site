/**
 * Production database READ-ONLY metadata check.
 *
 * Usage (run it yourself — the connection string never touches this repo):
 *   In the SAME terminal session only:
 *     PowerShell :  $env:PROD_DB_URL = '<paste>';  node scripts/prod-db-readonly-check.mjs;  Remove-Item Env:PROD_DB_URL
 *     CMD        :  set "PROD_DB_URL=<paste>" && node scripts/prod-db-readonly-check.mjs && set "PROD_DB_URL="
 *     Git Bash   :  read -s -r PROD_DB_URL && export PROD_DB_URL && node scripts/prod-db-readonly-check.mjs; unset PROD_DB_URL
 *   (Git Bash `read -s` keeps the value out of history; clear it after with unset.)
 *
 * The URL is read from the PROD_DB_URL environment variable, kept in memory
 * only, and never printed, logged, or written to disk. The script never
 * reads .env / .env.local / any repo file.
 *
 * Guarantees:
 *  - Refuses any URL whose scheme is not postgresql:// / postgres://.
 *  - Forces default_transaction_read_only = on and verifies it.
 *  - Reads metadata only: version, database/schema names, table existence,
 *    _prisma_migrations rows (names + timestamps only).
 *  - Never prints the URL, credentials, host, or any business data rows.
 *  - Sanitizes errors to a category code (no message text that may embed host).
 */
const out = {};
let pool;
try {
  const url = process.env.PROD_DB_URL;
  if (!url) {
    console.log(JSON.stringify({ ERROR: 'PROD_DB_URL environment variable is not set. See header comments for safe usage.' }, null, 1));
    process.exit(2);
  }
  const scheme = url.includes('://') ? url.split('://')[0] : null;
  if (scheme !== 'postgresql' && scheme !== 'postgres') {
    out.DATABASE_SCHEME_CHECK = `FAIL(scheme=${scheme ?? 'none'})`;
    console.log(JSON.stringify(out, null, 1));
    process.exit(3);
  }
  out.DATABASE_SCHEME_CHECK = 'PASS';

  const pg = (await import('pg')).default;
  pool = new pg.Pool({ connectionString: url, connectionTimeoutMillis: 8000 });
  const client = await pool.connect();
  try {
    await client.query('SET default_transaction_read_only = on');
    const ro = await client.query('SHOW default_transaction_read_only');
    out.SESSION_READ_ONLY = ro.rows[0].default_transaction_read_only === 'on' ? 'YES' : 'NO';

    const ver = await client.query('SELECT version() AS v');
    out.PRODUCTION_DATABASE_TYPE = 'PostgreSQL ' + (ver.rows[0].v.match(/PostgreSQL (\d+\.\d+)/)?.[1] ?? 'unknown');
    out.PRODUCTION_PROVIDER = 'PostgreSQL-compatible (verify Neon/other via dashboard)';

    const db = await client.query('SELECT current_database() AS d, current_schema() AS s');
    out.CURRENT_DATABASE_PRESENT = db.rows[0].d ? 'YES' : 'NO';
    out.CURRENT_SCHEMA = db.rows[0].s;

    const tables = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('_prisma_migrations','TrustedDevice','AdminUser','TalentApplication')"
    );
    const names = new Set(tables.rows.map((r) => r.table_name));
    out.PRISMA_MIGRATIONS_TABLE_EXISTS = names.has('_prisma_migrations') ? 'YES' : 'NO';
    out.TRUSTED_DEVICE_TABLE_EXISTS = names.has('TrustedDevice') ? 'YES' : 'NO';
    out.ADMIN_USER_TABLE_EXISTS = names.has('AdminUser') ? 'YES' : 'NO';
    out.TALENT_APPLICATION_TABLE_EXISTS = names.has('TalentApplication') ? 'YES' : 'NO';

    if (names.has('_prisma_migrations')) {
      const cols = await client.query(
        "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='_prisma_migrations'"
      );
      const cset = new Set(cols.rows.map((r) => r.column_name));
      const sel = ['migration_name', 'finished_at'];
      if (cset.has('rolled_back_at')) sel.push('rolled_back_at');
      const rows = (await client.query(`SELECT ${sel.join(', ')} FROM _prisma_migrations ORDER BY migration_name`)).rows;
      out.MIGRATION_COUNT = rows.length;
      out.MIGRATIONS = rows.map((r) => ({
        name: r.migration_name,
        finished: r.finished_at ? 'YES' : 'NO',
        rolledBack: 'rolled_back_at' in r ? (r.rolled_back_at ? 'YES' : 'NO') : 'n/a',
      }));
      const td = rows.find((r) => r.migration_name === '20260903231152_trusted_devices');
      out.TRUSTED_DEVICES_MIGRATION_APPLIED = td ? (td.finished_at ? 'YES' : 'NO (recorded, unfinished)') : 'NO';
    } else {
      out.TRUSTED_DEVICES_MIGRATION_APPLIED = 'UNKNOWN';
    }
    out.PRODUCTION_DATABASE_REACHABLE = 'YES';
  } finally {
    client.release();
  }
  await pool.end();
  console.log(JSON.stringify(out, null, 1));
} catch (e) {
  const code = typeof e?.code === 'string' ? e.code : 'UNCLASSIFIED';
  console.log(JSON.stringify({
    ERROR_CATEGORY: code,
    PRODUCTION_DATABASE_REACHABLE: /^(ECONN|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|EPROTO)/.test(code) ? 'NO' : 'UNKNOWN',
  }, null, 1));
  process.exit(1);
}
