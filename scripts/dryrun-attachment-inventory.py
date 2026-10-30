#!/usr/bin/env python3
"""READ-ONLY attachment reference inventory from legacy SQLite. Counts only — no filenames, no PII."""
import sqlite3, json, os, sys, urllib.request

sys.stdout.reconfigure(encoding='utf-8')
con = sqlite3.connect('file:dev.db?mode=ro', uri=True)

def extract_refs(raw):
    if not raw:
        return []
    try:
        v = json.loads(raw)
    except Exception:
        return [{'raw': True}]
    refs = []
    def walk(x):
        if isinstance(x, str):
            refs.append({'value': x})
        elif isinstance(x, dict):
            for key in ('url', 'path', 'href', 'file', 'filename', 'src'):
                if key in x and isinstance(x[key], str):
                    refs.append({'value': x[key], 'key': key})
                    return
            for val in x.values():
                walk(val)
        elif isinstance(x, list):
            for i in x:
                walk(i)
    walk(v)
    return refs

stats = {
    'applications_with_attachments': 0,
    'references_total': 0, 'blob_refs': 0, 'local_refs': 0,
    'resolvable': 0, 'missing': 0, 'unknown': 0,
}
rows = list(con.execute('SELECT id, attachments FROM "TalentApplication"'))
for (_id, att) in rows:
    refs = extract_refs(att)
    if not refs:
        continue
    stats['applications_with_attachments'] += 1
    for ref in refs:
        stats['references_total'] += 1
        v = ref.get('value', '')
        if ref.get('raw'):
            stats['unknown'] += 1
            continue
        if 'vercel-storage' in v or v.startswith('https://') and 'blob' in v:
            stats['blob_refs'] += 1
            try:
                req = urllib.request.Request(v, method='HEAD')
                with urllib.request.urlopen(req, timeout=5) as r:
                    if 200 <= r.status < 400:
                        stats['resolvable'] += 1
                    else:
                        stats['missing'] += 1
            except Exception:
                stats['missing'] += 1
        elif v.startswith('/uploads') or v.startswith('uploads/'):
            stats['local_refs'] += 1
            p = os.path.join('public', v.lstrip('/'))
            if os.path.exists(p):
                stats['resolvable'] += 1
            else:
                stats['missing'] += 1
        else:
            stats['unknown'] += 1

print(json.dumps(stats, ensure_ascii=False))
con.close()
