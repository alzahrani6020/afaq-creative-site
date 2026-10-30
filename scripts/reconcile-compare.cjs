/**
 * READ-ONLY reconciliation: Neon PostgreSQL vs SQLite fingerprint (stdin).
 * Emits counts only: SQLITE_ONLY / POSTGRES_ONLY / EXACT_MATCH / CONFLICTING_MATCH.
 * Never prints row content, keys, ids, names, emails, or credentials.
 * Session forced read-only. Zero DDL/DML.
 * Usage:
 *   export CANDIDATE_DB_URL="$(neonctl connection-string --project-id <id> 2>/dev/null | tr -d '\r\n ')"
 *   python scripts/reconcile-sqlite-fingerprint.py | node scripts/reconcile-compare.cjs
 *   unset CANDIDATE_DB_URL
 */
let sqliteData = '';
process.stdin.on('data', (d) => (sqliteData += d));
process.stdin.on('end', async () => {
  const S = JSON.parse(sqliteData);
  const { Client } = require('pg');

  const norm = (v) => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    if (v instanceof Date) return v.toISOString().replace(/\.\d{3}Z$/, m => m); // ISO ms
    let s = String(v).trim();
    const m = s.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/);
    if (m) {
      const d = new Date(s.replace(' ', 'T') + (m[4] ? '' : 'Z'));
      if (!isNaN(d)) return d.toISOString();
    }
    return s;
  };
  const canon = (s) => {
    try {
      const v = JSON.parse(s);
      if (v && typeof v === 'object') return JSON.stringify(v, Object.keys(v).sort());
    } catch {}
    return s;
  };
  const sha = (parts) =>
    require('crypto').createHash('sha256').update(parts.join('|'), 'utf8').digest('hex');

  const client = new Client({
    connectionString: process.env.CANDIDATE_DB_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });
  try {
    await client.connect();
    await client.query('SET default_transaction_read_only = on');
    const ro = await client.query('SHOW default_transaction_read_only');
    if (ro.rows[0].default_transaction_read_only !== 'on') throw new Error('READONLY_ENFORCE_FAILED');

    const q = async (sql, params = []) => (await client.query(sql, params)).rows;

    const out = { READONLY: 'YES' };

    // ---- Build PG fingerprints (same logic as SQLite side) ----
    const TABLES = {
      TalentApplication: {
        key: (r) => [norm(r.applicationNumber).toLowerCase()],
        content: (r) => ['category','fields','specialized','personal','phone','email','attachments',
          'status','adminNotes','country','region','city','district','serviceArea','workPlace',
          'sanaieePlatformConsent','sanaieeConsentAt','sanaieeProfileStatus','createdAt','updatedAt']
          .map((c) => ['fields','personal','attachments'].includes(c) ? canon(norm(r[c])) : norm(r[c])),
      },
      AdminUser: {
        key: (r) => [norm(r.email).toLowerCase()],
        content: (r) => ['name','passwordHash','role','isActive','lastLoginAt','createdAt','updatedAt'].map((c) => norm(r[c])),
      },
      ApplicantSkillProfile: {
        key: (r) => [String(appNumById[r.applicationId] || '').toLowerCase(), norm(r.profileType).toLowerCase(), norm(r.profession).toLowerCase()],
        content: (r) => ['sector','specializations','services','skillLevel','yearsExperience','description',
          'isPrimary','isCustomProfession','verificationStatus','customProfessionName','customProfessionLocalName',
          'customProfessionDescription','customProfessionClosestSector','createdAt','updatedAt']
          .map((c) => ['specializations','services'].includes(c) ? canon(norm(r[c])) : norm(r[c])),
      },
    };

    const appRows = await q('SELECT * FROM "TalentApplication"');
    const appNumById = {};
    for (const r of appRows) appNumById[r.id] = norm(r.applicationNumber).toLowerCase();

    out.COMPARISON = {};
    for (const [t, spec] of Object.entries(TABLES)) {
      const rows = t === 'TalentApplication' ? appRows : await q(`SELECT * FROM "${t}"`);
      const pg = {};
      for (const r of rows) pg[sha(spec.key(r))] = { ch: sha(spec.content(r)), id: norm(r.id) };
      const sq = S.tables[t] || {};
      const cls = { SQLITE_ONLY: 0, POSTGRES_ONLY: 0, EXACT_MATCH: 0, CONFLICTING_MATCH: 0 };
      const allKeys = new Set([...Object.keys(sq), ...Object.keys(pg)]);
      for (const k of allKeys) {
        const a = sq[k], b = pg[k];
        if (a && b) cls[a.ch === b.ch ? 'EXACT_MATCH' : 'CONFLICTING_MATCH']++;
        else if (a) cls.SQLITE_ONLY++;
        else cls.POSTGRES_ONLY++;
      }
      // shared raw-id counts (same origin signal), hashed comparison only
      const sqIds = S.meta['ids_' + t] || {};
      let sharedIds = 0, sharedSameContent = 0;
      for (const [hashId, rawId] of Object.entries(sqIds)) {
        const pgRow = rows.find((r) => norm(r.id) === rawId);
        if (pgRow) {
          sharedIds++;
          const pgEntry = pg[sha(spec.key(pgRow))];
          const sqEntry = sq[Object.keys(sq).find((k) => sq[k].id === rawId)];
          if (pgEntry && sqEntry && pgEntry.ch === sqEntry.ch) sharedSameContent++;
        }
      }
      out.COMPARISON[t] = { ...cls, shared_raw_ids: sharedIds, shared_ids_exact: sharedSameContent };
    }

    // ---- Admin/auth metadata ----
    const admins = await q('SELECT * FROM "AdminUser"');
    const algo = {};
    for (const a of admins) {
      const s = a.passwordHash || '';
      const c = s.startsWith('$2') ? 'bcrypt' : s.startsWith('$argon2') ? 'argon2' : s.startsWith('scrypt:') ? 'scrypt' : 'other';
      algo[c] = (algo[c] || 0) + 1;
    }
    out.PG_PASSWORD_ALGO = algo;
    // AdminUser password/field match is already captured by COMPARISON.AdminUser
    // (content hash covers passwordHash among the other columns).

    // ---- Enum/domain validation data ----
    const enumLabels = await q(`SELECT e.enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname IN ('ApplicationStatus','EmailStatus') ORDER BY t.typname, e.enumsortorder`);
    out.PG_ENUM_LABELS = enumLabels.map((r) => r.enumlabel);
    out.SQLITE_DISTINCT = {};
    for (const [k, v] of Object.entries(S.meta)) if (k.startsWith('distinct_')) out.SQLITE_DISTINCT[k] = v;
    const pgDistinct = async (t, c) => (await q(`SELECT DISTINCT "${c}" AS v FROM "${t}"`)).map((r) => norm(r.v)).sort();
    out.PG_DISTINCT = {
      'TalentApplication.status': await pgDistinct('TalentApplication', 'status'),
      'TalentApplication.sanaieeProfileStatus': await pgDistinct('TalentApplication', 'sanaieeProfileStatus'),
      'ApplicantSkillProfile.verificationStatus': await pgDistinct('ApplicantSkillProfile', 'verificationStatus'),
      'ApplicantSkillProfile.profileType': await pgDistinct('ApplicantSkillProfile', 'profileType'),
      'AdminUser.role': await pgDistinct('AdminUser', 'role'),
    };
    out.SQLITE_PASSWORD_ALGO = S.meta.sqlite_password_algo;

    // ---- PG-only table row counts (EmailVerificationToken) ----
    out.PG_ONLY_COUNTS = { EmailVerificationToken: (await q('SELECT COUNT(*)::int AS n FROM "EmailVerificationToken"'))[0].n };

    out.WRITE_OPERATION_PERFORMED = 'NO';
    out.PII_EXPOSED = 'NO';
    console.log(JSON.stringify(out, null, 1));
  } catch (e) {
    console.log(JSON.stringify({ ERROR: e.code || 'FAILED', READONLY: 'YES' }, null, 1));
    process.exit(1);
  } finally {
    try { await client.end(); } catch {}
  }
});
