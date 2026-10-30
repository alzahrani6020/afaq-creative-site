import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const dbUrl = process.env.DATABASE_URL || '';

function main() {
  const backupsDir = path.resolve('backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const now = new Date();
  const timestamp = now.toISOString().replace(/[:T]/g, '-').split('.')[0];

  if (dbUrl.startsWith('file:')) {
    // SQLite backup
    const dbPath = dbUrl.slice('file:'.length);
    if (!fs.existsSync(dbPath)) {
      console.error('Database file not found:', dbPath);
      process.exit(1);
    }
    const fileName = `talents-${timestamp}.db`;
    const backupPath = path.join(backupsDir, fileName);
    fs.copyFileSync(dbPath, backupPath);
    console.log('SQLite backup created:', backupPath);
    return;
  }

  if (dbUrl.startsWith('postgres') || dbUrl.startsWith('postgresql')) {
    // PostgreSQL backup via pg_dump
    try {
      const fileName = `talents-${timestamp}.sql`;
      const backupPath = path.join(backupsDir, fileName);
      execSync(`pg_dump "${dbUrl}" > "${backupPath}"`, { stdio: 'inherit' });
      console.log('PostgreSQL backup created:', backupPath);
    } catch (err) {
      console.error(
        'Failed to run pg_dump. Make sure PostgreSQL client tools are installed and in PATH.'
      );
      console.error(err);
      process.exit(1);
    }
    return;
  }

  console.error('Unsupported DATABASE_URL protocol:', dbUrl.split('://')[0]);
  process.exit(1);
}

main();
