/**
 * READ-ONLY verification of the Neon candidate database (afaq-talents-production).
 *
 * Usage (Git Bash, single command line — value stays in memory only):
 *   export CANDIDATE_DB_URL="$(neonctl connection-string --project-id <id> 2>/dev/null | tr -d '\r\n ')"
 *   node scripts/neon-candidate-readonly-verify.cjs
 *   unset CANDIDATE_DB_URL
 *
 * Guarantees:
 *  - URL only from CANDIDATE_DB_URL env var; scheme must be postgres:// or postgresql://.
 *  - Session forced read-only (default_transaction_read_only=on) and verified.
 *  - SELECT / catalog reads only. Zero DDL/DML.
 *  - Never prints URL, host, credentials, or any row content — counts and
 *    aggregate timestamps only. Error messages sanitized to category codes.
 */
const out = {};
let client;

function bail(code, extra) {
  console.log(JSON.stringify({ ERROR: code, ...extra }, null, 1));
  process.exit(code === 'SCHEME_FAIL' ? 3 : 1);
}

(async () => {
  const url = process.env.CANDIDATE_DB_URL;
  if (!url) bail('NO_URL', { hint: 'set CANDIDATE_DB_URL first' });
  const scheme = url.includes('://') ? url.split('://')[0] : null;
  if (scheme !== 'postgres' && scheme !== 'postgresql') bail('SCHEME_FAIL');

  const { Client } = require('pg');
  client = new Client({
    connectionString: url,
    connectionTimeoutMillis: 10000,
    ssl: { rejectUnauthorized: false }, // hosted PG (Neon) requires SSL
  });
  try {
    await client.connect();
  } catch (e) {
    const code = typeof e?.code === 'string' ? e.code : 'CONNECT_FAILED';
    bail('CONNECT_FAILED', { ERROR_CATEGORY: code });
  }

  try {
    await client.query('SET default_transaction_read_only = on');
    const ro = await client.query('SHOW default_transaction_read_only');
    out.SESSION_READ_ONLY = ro.rows[0].default_transaction_read_only === 'on' ? 'YES' : 'NO';
    if (out.SESSION_READ_ONLY !== 'YES') bail('READONLY_ENFORCE_FAILED');

    const ver = await client.query('SELECT version() AS v');
    out.POSTGRES_VERSION = ver.rows[0].v.match(/PostgreSQL (\d+\.\d+)/)?.[1] ?? 'unknown';

    const ident = await client.query('SELECT current_database() AS db, current_schema() AS sch');
    out.DATABASE_PRESENT = ident.rows[0].db ? 'YES' : 'NO';
    out.SCHEMA = ident.rows[0].sch;
    out.DATABASE_REACHABLE = 'YES';

    // --- Schema fingerprint: all user tables ---
    const allTables = await client.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = current_schema() AND table_type = 'BASE TABLE'
       ORDER BY table_name`
    );
    out.ALL_TABLES = allTables.rows.map((r) => r.table_name);

    const critical = [
      '_prisma_migrations', 'TalentApplication', 'ApplicantSkillProfile',
      'AdminUser', 'AdminActivity', 'TalentApplicationActivity',
      'EmailVerificationToken', 'TrustedDevice',
    ];
    out.CRITICAL_TABLES = {};
    for (const t of critical) out.CRITICAL_TABLES[t] = out.ALL_TABLES.includes(t) ? 'YES' : 'NO';

    // --- Migration fingerprint ---
    if (out.CRITICAL_TABLES._prisma_migrations === 'YES') {
      const hist = await client.query(
        `SELECT migration_name, finished_at, rolled_back_at
         FROM _prisma_migrations ORDER BY started_at`
      );
      out.MIGRATION_COUNT = hist.rows.length;
      out.MIGRATIONS = hist.rows.map((r) => ({
        name: r.migration_name,
        finished: r.finished_at ? 'YES' : 'NO',
        rolledBack: r.rolled_back_at ? 'YES' : 'NO',
      }));
      const td = hist.rows.find((r) => r.migration_name.includes('20260903231152_trusted_devices'));
      out.TRUSTED_DEVICES_MIGRATION_PRESENT = td ? (td.finished_at ? 'YES(finished)' : 'YES(unfinished)') : 'NO';
    }

    // --- Data fingerprint: counts + aggregate timestamps only ---
    const countTargets = [
      'TalentApplication', 'ApplicantSkillProfile', 'AdminUser',
      'AdminActivity', 'TalentApplicationActivity', 'EmailVerificationToken', 'TrustedDevice',
    ];
    out.ROW_COUNTS = {};
    out.TIMESTAMPS = {};
    for (const t of countTargets) {
      if (out.CRITICAL_TABLES[t] !== 'YES') continue;
      const c = await client.query(`SELECT COUNT(*)::int AS n FROM "${t}"`);
      out.ROW_COUNTS[t] = c.rows[0].n;
      const cols = await client.query(
        `SELECT column_name FROM information_schema.columns
         WHERE table_schema = current_schema() AND table_name = $1`, [t]
      );
      const hasCreated = cols.rows.some((r) => r.column_name === 'createdAt');
      if (hasCreated && c.rows[0].n > 0) {
        const mm = await client.query(
          `SELECT MIN("createdAt") AS min_c, MAX("createdAt") AS max_c FROM "${t}"`
        );
        out.TIMESTAMPS[t] = { min: mm.rows[0].min_c, max: mm.rows[0].max_c };
      }
    }

    out.WRITE_OPERATION_PERFORMED = 'NO';
    out.PII_EXPOSED = 'NO';
    out.SECRET_EXPOSED = 'NO';
    out.DONE = 'YES';
    console.log(JSON.stringify(out, null, 1));
  } catch (e) {
    const code = typeof e?.code === 'string' ? e.code : 'QUERY_FAILED';
    console.log(JSON.stringify({ ERROR: 'QUERY_FAILED', ERROR_CATEGORY: code }, null, 1));
    process.exit(1);
  } finally {
    try { await client.end(); } catch {}
  }
})();
