/**
 * READ-ONLY Production DB verification. Deletes nothing, writes nothing.
 * Never prints DATABASE_URL or row data from user tables.
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function loadDbUrl() {
  const file = path.join(__dirname, '..', '.prod-db-verify.env');
  const line = fs.readFileSync(file, 'utf8').split('\n')
    .find((l) => l.startsWith('DATABASE_URL='));
  if (!line) throw new Error('DATABASE_URL not found in pulled env file');
  let v = line.slice('DATABASE_URL='.length).trim();
  if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
  return v;
}

async function connect(url) {
  const attempts = [
    {}, // default
    { ssl: { rejectUnauthorized: false } }, // hosted PG (Neon/Vercel Postgres)
  ];
  let lastErr;
  for (const extra of attempts) {
    const client = new Client({ connectionString: url, ...extra });
    try {
      await client.connect();
      return client;
    } catch (e) {
      lastErr = e;
      try { await client.end(); } catch {}
    }
  }
  throw lastErr;
}

async function main() {
  const url = loadDbUrl();
  const client = await connect(url);
  try {
    const version = await client.query('SELECT version() AS v');
    console.log('SERVER_VERSION:', version.rows[0].v.split(' ').slice(0, 2).join(' '));

    const tables = await client.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name IN ('_prisma_migrations','TrustedDevice','AdminUser','TalentApplication')
       ORDER BY table_name`
    );
    const present = new Set(tables.rows.map((r) => r.table_name));
    console.log('TABLE__prisma_migrations:', present.has('_prisma_migrations'));
    console.log('TABLE_TrustedDevice:', present.has('TrustedDevice'));
    console.log('TABLE_AdminUser:', present.has('AdminUser'));
    console.log('TABLE_TalentApplication:', present.has('TalentApplication'));

    if (present.has('_prisma_migrations')) {
      const hist = await client.query(
        `SELECT migration_name, finished_at, rolled_back_at
         FROM _prisma_migrations ORDER BY started_at`
      );
      console.log('MIGRATION_COUNT:', hist.rows.length);
      for (const r of hist.rows) {
        console.log(
          'MIGRATION:',
          r.migration_name,
          '| finished:', r.finished_at ? 'yes' : 'NO',
          '| rolled_back:', r.rolled_back_at ? 'YES' : 'no'
        );
      }
      const td = hist.rows.find((r) =>
        r.migration_name.includes('20260903231152_trusted_devices')
      );
      console.log('TRUSTED_DEVICES_MIGRATION_FOUND:', Boolean(td));
      if (td) {
        console.log('TRUSTED_DEVICES_FINISHED:', Boolean(td.finished_at));
        console.log('TRUSTED_DEVICES_ROLLED_BACK:', Boolean(td.rolled_back_at));
      }
    }
  } finally {
    await client.end();
  }
}

main().then(
  () => { console.log('VERIFY_DONE'); process.exit(0); },
  (e) => { console.log('VERIFY_FAILED:', e.message); process.exit(1); }
);
