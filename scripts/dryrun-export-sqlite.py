#!/usr/bin/env python3
"""Export business rows from legacy SQLite as JSONL on stdout (pipe only, no files).
Read-only. Tables: TalentApplication, ApplicantSkillProfile, TalentApplicationActivity, AdminActivity.
"""
import sqlite3, json, sys
sys.stdout.reconfigure(encoding='utf-8')

con = sqlite3.connect('file:dev.db?mode=ro', uri=True)
con.row_factory = sqlite3.Row

TABLES = [
    'TalentApplication',
    'ApplicantSkillProfile',
    'TalentApplicationActivity',
    'AdminActivity',
]
for t in TABLES:
    for r in con.execute('SELECT * FROM "%s"' % t):
        json.dump({'table': t, 'row': dict(r)}, sys.stdout, ensure_ascii=False)
        sys.stdout.write('\n')
con.close()
