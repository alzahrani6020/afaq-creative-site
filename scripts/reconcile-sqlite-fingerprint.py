#!/usr/bin/env python3
"""
READ-ONLY fingerprint of legacy SQLite (dev.db).
Emits JSON on stdout: {keyHash: contentHash} per business table + metadata.
Never prints row content, names, emails, phones, or raw ids.
Usage: python scripts/reconcile-sqlite-fingerprint.py
"""
import sqlite3, json, hashlib, re, sys
from datetime import datetime, timezone
sys.stdout.reconfigure(encoding='utf-8')

DB = 'dev.db'
TABLES = {
    'TalentApplication': {
        'key': ['applicationNumber'],
        'content': ['category','fields','specialized','personal','phone','email','attachments',
                    'status','adminNotes','country','region','city','district','serviceArea','workPlace',
                    'sanaieePlatformConsent','sanaieeConsentAt','sanaieeProfileStatus','createdAt','updatedAt'],
    },
    'AdminUser': {
        'key': ['email'],
        'content': ['name','passwordHash','role','isActive','lastLoginAt','createdAt','updatedAt'],
    },
    'ApplicantSkillProfile': {
        'key': ['__join_appnumber__', 'profileType', 'profession'],
        'content': ['sector','specializations','services','skillLevel','yearsExperience','description',
                    'isPrimary','isCustomProfession','verificationStatus',
                    'customProfessionName','customProfessionLocalName','customProfessionDescription',
                    'customProfessionClosestSector','createdAt','updatedAt'],
        'join': ('applicationId', 'TalentApplication', 'applicationNumber'),
    },
}
BOOL_COLS = {'sanaieePlatformConsent','isPrimary','isCustomProfession','isActive','used','adminNotified','emailVerified'}
ENUMISH = {
    'TalentApplication': ['status','sanaieeProfileStatus'],
    'ApplicantSkillProfile': ['verificationStatus','profileType'],
    'AdminUser': ['role'],
}

def norm_text(v):
    if v is None: return ''
    if isinstance(v, bool): return 'true' if v else 'false'
    if isinstance(v, int) and v in (0,1): return 'true' if v==1 else 'false'
    s = str(v).strip()
    # datetime normalization
    if re.match(r'^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}', s):
        try:
            d = datetime.fromisoformat(s.replace('Z', '+00:00').replace(' ', 'T'))
            if d.tzinfo is None: d = d.replace(tzinfo=timezone.utc)
            return d.astimezone(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z')
        except ValueError:
            return s
    return s

def canon_json(s):
    try:
        v = json.loads(s)
        if isinstance(v, (dict, list)):
            return json.dumps(v, sort_keys=True, ensure_ascii=False)
    except Exception:
        pass
    return s

def h(parts):
    return hashlib.sha256('|'.join(parts).encode('utf-8')).hexdigest()

con = sqlite3.connect('file:' + DB + '?mode=ro', uri=True)
con.row_factory = sqlite3.Row
out = {'tables': {}, 'meta': {}}

for t, spec in TABLES.items():
    rows = [dict(r) for r in con.execute('SELECT * FROM "%s"' % t)]
    table = {}
    appnum_by_id = {}
    if t == 'TalentApplication':
        appnum_by_id = {r['id']: norm_text(r['applicationNumber']).lower() for r in rows}
    join_map = {}
    if 'join' in spec:
        fkc, pt, kc = spec['join']
        join_map = {r['id']: norm_text(r[kc]).lower()
                    for r in con.execute('SELECT id, "%s" FROM "%s"' % (kc, pt))}
    for r in rows:
        key_parts = []
        for kc in spec['key']:
            if kc == '__join_appnumber__':
                key_parts.append(join_map.get(norm_text(r[spec['join'][0]]), ''))
            else:
                key_parts.append(norm_text(r.get(kc)).lower())
        kh = h(key_parts)
        content = []
        for cc in spec['content']:
            v = norm_text(r.get(cc))
            content.append(canon_json(v) if cc in ('fields','personal','attachments','specializations','services','specialized') else v)
        table[kh] = {'ch': h(content), 'id': norm_text(r['id'])}
    out['tables'][t] = table

# shared-id list per table (ids only, hashed — even ids are not printed raw)
for t in ['TalentApplication','AdminUser','ApplicantSkillProfile','AdminActivity','TalentApplicationActivity']:
    ids = [norm_text(r[0]) for r in con.execute('SELECT id FROM "%s"' % t)]
    out['meta']['ids_' + t] = {hashlib.sha256(i.encode()).hexdigest(): i for i in ids}

# distinct enum-ish values (non-PII)
for t, cols in ENUMISH.items():
    for c in cols:
        vals = sorted({norm_text(r[0]) for r in con.execute('SELECT "%s" FROM "%s"' % (c, t))})
        out['meta']['distinct_%s.%s' % (t, c)] = vals

# password hash algorithm detection (prefix class only, no hash output)
algos = {}
for (ph,) in con.execute('SELECT passwordHash FROM AdminUser'):
    s = (ph or '')
    cls = 'bcrypt' if s.startswith('$2') else ('argon2' if s.startswith('$argon2') else ('scrypt' if s.startswith('scrypt:') else 'other'))
    algos[cls] = algos.get(cls, 0) + 1
out['meta']['sqlite_password_algo'] = algos

json.dump(out, sys.stdout, ensure_ascii=False)
