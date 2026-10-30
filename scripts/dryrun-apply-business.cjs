/**
 * Dry Run: apply SQLite business rows to the NEON DRY-RUN BRANCH only.
 * - Lookup-based idempotency (no ON CONFLICT reliance).
 * - INSERT-only. Never UPDATE/DELETE.
 * - Emits JSONL manifest to MANIFEST_PATH (hashed ids, no PII).
 * Usage:
 *   python scripts/dryrun-export-sqlite.py | DRYRUN_DB_URL="<branch url>" MANIFEST_PATH="..." node scripts/dryrun-apply-business.cjs
 */
const fs = require('fs');
const crypto = require('crypto');
const sha = (s) => crypto.createHash('sha256').update(String(s), 'utf8').digest('hex');
const RUN_ID = process.env.RUN_ID || `run-${Date.now()}`;
const MANIFEST = fs.createWriteStream(process.env.MANIFEST_PATH, { flags: 'a' });
const manifest = (rec) => MANIFEST.write(JSON.stringify({ run_id: RUN_ID, ts: new Date().toISOString(), ...rec }) + '\n');

const STATUS_ENUM = ['new', 'under_review', 'qualified', 'need_information', 'contacted', 'accepted', 'rejected'];

const TA_COLS = ['id','applicationNumber','category','fields','specialized','personal','phone','email','attachments',
  'status','adminNotes','country','region','city','district','serviceArea','workPlace',
  'sanaieePlatformConsent','sanaieeConsentAt','sanaieeProfileStatus','createdAt','updatedAt'];
const ASP_COLS = ['id','applicationId','profileType','sector','profession','specializations','services','skillLevel',
  'yearsExperience','description','isPrimary','isCustomProfession','verificationStatus',
  'customProfessionName','customProfessionLocalName','customProfessionDescription',
  'customProfessionClosestSector','createdAt','updatedAt'];
const TAA_COLS = ['id','applicationId','adminUserId','action','oldValue','newValue','createdAt'];
const AA_COLS = ['id','adminUserId','action','metadata','createdAt'];

const norm = (v) => {
  if (v === null || v === undefined) return null;
  if (v === true || v === 'true' || v === 1 || v === '1') return true;
  if (v === false || v === 'false' || v === 0 || v === '0') return false;
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}/.test(v)) return v.replace(' ', 'T');
  return v;
};

async function main() {
  const url = process.env.DRYRUN_DB_URL;
  const expected = process.env.EXPECTED_ENDPOINT;
  if (!url || !expected || !url.includes(expected)) {
    console.log(JSON.stringify({ ERROR: 'REFUSED: DRYRUN_DB_URL missing or endpoint not pinned via EXPECTED_ENDPOINT' }));
    process.exit(3);
  }
  const { Client } = require('pg');
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });
  await client.connect();

  // read all input
  let input = '';
  process.stdin.on('data', (d) => (input += d));
  await new Promise((res) => process.stdin.on('end', res));
  const lines = input.split('\n').filter(Boolean).map((l) => JSON.parse(l));

  const summary = {};
  await client.query('BEGIN');
  try {
    for (const { table, row } of lines) {
      summary[table] = summary[table] || { inserted: 0, already_exists: 0, errors: 0 };
      let cols, natural;
      if (table === 'TalentApplication') { cols = TA_COLS; natural = ['applicationNumber']; }
      else if (table === 'ApplicantSkillProfile') { cols = ASP_COLS; natural = null; } // child: id-presence check
      else if (table === 'TalentApplicationActivity') { cols = TAA_COLS; natural = null; }
      else if (table === 'AdminActivity') { cols = AA_COLS; natural = null; }
      else { summary[table].errors++; manifest({ table, source_id_hash: sha(row.id || '?'), action: 'skip', result: 'unknown_table' }); continue; }

      // AdminActivity: FK adminUserId NOT NULL -> SQLite rows are 0; if any appear, refuse (AdminUser out of scope)
      if (table === 'AdminActivity' && row.adminUserId) {
        const adminExists = await client.query('SELECT 1 FROM "AdminUser" WHERE id=$1', [row.adminUserId]);
        if (!adminExists.rows.length) {
          summary[table].errors++;
          manifest({ table, source_id_hash: sha(row.id), action: 'refused', result: 'admin_user_not_migrated' });
          continue;
        }
      }
      if (table === 'TalentApplicationActivity' && row.adminUserId) {
        const adminExists = await client.query('SELECT 1 FROM "AdminUser" WHERE id=$1', [row.adminUserId]);
        if (!adminExists.rows.length) {
          // FK is nullable in PG? No — adminUserId nullable (SET NULL). Keep value only if exists, else null.
          row = { ...row, adminUserId: null };
        }
      }

      // idempotency check
      let exists = false;
      if (natural) {
        const where = natural.map((c, i) => `"${c}"=$${i + 1}`).join(' AND ');
        const r = await client.query(`SELECT id FROM "${table}" WHERE ${where}`, natural.map((c) => norm(row[c])));
        exists = r.rows.length > 0;
      } else {
        const r = await client.query(`SELECT id FROM "${table}" WHERE id=$1`, [row.id]);
        exists = r.rows.length > 0;
      }

      if (exists) {
        summary[table].already_exists++;
        manifest({ table, source_id_hash: sha(row.id), action: 'already_exists' });
        continue;
      }

      // enum validation
      if (table === 'TalentApplication' && !STATUS_ENUM.includes(row.status)) {
        summary[table].errors++;
        manifest({ table, source_id_hash: sha(row.id), action: 'rejected', result: 'invalid_status' });
        continue;
      }

      // FK check: child rows reference a TalentApplication that must exist (by id)
      if (table === 'ApplicantSkillProfile' || table === 'TalentApplicationActivity') {
        const p = await client.query('SELECT id FROM "TalentApplication" WHERE id=$1', [row.applicationId]);
        if (!p.rows.length) {
          summary[table].errors++;
          manifest({ table, source_id_hash: sha(row.id), action: 'rejected', result: 'parent_missing' });
          continue;
        }
      }

      const vals = cols.map((c) => norm(row[c]));
      const sql = `INSERT INTO "${table}" (${cols.map((c) => `"${c}"`).join(',')}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(',')})`;
      try {
        await client.query(sql, vals);
        summary[table].inserted++;
        manifest({ table, source_id_hash: sha(row.id), action: 'inserted', result: 'ok' });
      } catch (e) {
        summary[table].errors++;
        manifest({ table, source_id_hash: sha(row.id), action: 'error', result: e.code || 'FAILED' });
      }
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    console.log(JSON.stringify({ ERROR: 'ROLLBACK', category: e.code || e.message }));
    process.exit(1);
  } finally {
    await client.end();
    MANIFEST.end();
  }
  console.log(JSON.stringify({ RUN_ID, summary }, null, 1));
}
main().catch((e) => { console.log(JSON.stringify({ ERROR: e.code || e.message })); process.exit(1); });
