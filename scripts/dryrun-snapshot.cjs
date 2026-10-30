/**
 * Snapshot content hashes of all rows on the DRY-RUN BRANCH (for G5/G6-style proofs).
 * Output: JSON file {table: {rowKeyHash: contentHash}}. No PII, no ids in clear.
 * Usage: DRYRUN_DB_URL="<branch url>" node scripts/dryrun-snapshot.cjs <out.json>
 */
const fs = require('fs');
const crypto = require('crypto');
const sha = (s) => crypto.createHash('sha256').update(String(s), 'utf8').digest('hex');

const TABLES = ['TalentApplication', 'ApplicantSkillProfile', 'AdminUser', 'AdminActivity',
  'TalentApplicationActivity', 'EmailVerificationToken'];

(async () => {
  const url = process.env.DRYRUN_DB_URL;
  const expected = process.env.EXPECTED_ENDPOINT;
  if (!url || !expected || !url.includes(expected)) {
    console.log(JSON.stringify({ ERROR: 'REFUSED: not a pinned endpoint (set EXPECTED_ENDPOINT)' }));
    process.exit(3);
  }
  const outPath = process.argv[2];
  const { Client } = require('pg');
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });
  await client.connect();
  await client.query('SET default_transaction_read_only = on');
  const snap = {};
  for (const t of TABLES) {
    const rows = (await client.query(`SELECT * FROM "${t}"`)).rows;
    const m = {};
    for (const r of rows) {
      const canon = Object.keys(r).sort().map((k) => {
        const v = r[k] instanceof Date ? r[k].toISOString() : r[k];
        return `${k}=${v === null ? '∅' : v}`;
      }).join('|');
      m[sha(r.id)] = sha(canon);
    }
    snap[t] = { count: rows.length, rows: m };
  }
  await client.end();
  fs.writeFileSync(outPath, JSON.stringify(snap));
  console.log(JSON.stringify({ SNAPSHOT: outPath, counts: Object.fromEntries(Object.entries(snap).map(([k, v]) => [k, v.count])) }));
})().catch((e) => { console.log(JSON.stringify({ ERROR: e.code || e.message })); process.exit(1); });
