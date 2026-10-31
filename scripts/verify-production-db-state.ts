import { Client } from 'pg';

const migrationNames = [
  '20261031070000_add_admin_runtime_tables',
  '20261031070500_lock_down_admin_data_api',
];
const migrationVersions = ['20261031070000', '20261031070500'];
const tables = [
  'TalentApplication',
  'AdminUser',
  'TalentApplicationActivity',
  'AdminActivity',
  'ApplicantSkillProfile',
  'EmailVerificationToken',
  'TrustedDevice',
  'OAuthLoginAttempt',
];

async function main() {
  if (process.env.VERCEL_ENV !== 'production') {
    console.log('AFAQ_PROD_DB_VERIFY', JSON.stringify({ skipped: true, reason: 'non-production' }));
    return;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is unavailable in production build environment');

  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query('BEGIN READ ONLY');

    const existence = await client.query<{
      trusted_device: boolean;
      oauth_login_attempt: boolean;
    }>(`
      SELECT
        to_regclass('"TrustedDevice"') IS NOT NULL AS trusted_device,
        to_regclass('"OAuthLoginAttempt"') IS NOT NULL AS oauth_login_attempt
    `);

    const rls = await client.query<{ relname: string; relrowsecurity: boolean }>(
      `
        SELECT c.relname, c.relrowsecurity
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname = ANY($1::text[])
      `,
      [tables]
    );

    const grants = await client.query<{ grantee: string; table_name: string; privilege_type: string }>(
      `
        SELECT grantee, table_name, privilege_type
        FROM information_schema.role_table_grants
        WHERE table_schema = 'public'
          AND grantee IN ('anon', 'authenticated')
          AND table_name = ANY($1::text[])
      `,
      [tables]
    );

    const defaultAcl = await client.query<{ acl: string | null }>(`
      SELECT array_to_string(defaclacl, ',') AS acl
      FROM pg_default_acl
      WHERE defaclrole = 'postgres'::regrole
        AND defaclnamespace = 'public'::regnamespace
        AND defaclobjtype IN ('r', 'S')
    `);

    const prismaMigrationTable = await client.query<{ exists: boolean }>(
      `SELECT to_regclass('"_prisma_migrations"') IS NOT NULL AS exists`
    );
    let prismaRecorded: string[] = [];
    if (prismaMigrationTable.rows[0]?.exists) {
      const rows = await client.query<{ migration_name: string }>(
        `SELECT migration_name FROM "_prisma_migrations" WHERE migration_name = ANY($1::text[])`,
        [migrationNames]
      );
      prismaRecorded = rows.rows.map((row) => row.migration_name);
    }

    const supabaseMigrationTable = await client.query<{ exists: boolean }>(
      `SELECT to_regclass('supabase_migrations.schema_migrations') IS NOT NULL AS exists`
    );
    let supabaseRecorded: string[] = [];
    if (supabaseMigrationTable.rows[0]?.exists) {
      const rows = await client.query<{ version: string }>(
        `SELECT version::text FROM supabase_migrations.schema_migrations WHERE version::text = ANY($1::text[])`,
        [migrationVersions]
      );
      supabaseRecorded = rows.rows.map((row) => row.version);
    }

    const rlsMap = new Map(rls.rows.map((row) => [row.relname, row.relrowsecurity]));
    const allRlsEnabled = tables.every((table) => rlsMap.get(table) === true);
    const noClientTableGrants = grants.rowCount === 0;
    const defaultAclSafe = defaultAcl.rows.every(
      (row) => !row.acl || (!row.acl.includes('anon=') && !row.acl.includes('authenticated='))
    );

    const result = {
      trustedDeviceTable: existence.rows[0]?.trusted_device === true,
      oauthLoginAttemptTable: existence.rows[0]?.oauth_login_attempt === true,
      allEightTablesHaveRls: allRlsEnabled,
      anonAuthenticatedTableGrantsAbsent: noClientTableGrants,
      defaultTableSequencePrivilegesLockedDown: defaultAclSafe,
      prismaHistory: {
        tableExists: prismaMigrationTable.rows[0]?.exists === true,
        migration070000Recorded: prismaRecorded.includes(migrationNames[0]),
        migration070500Recorded: prismaRecorded.includes(migrationNames[1]),
      },
      supabaseHistory: {
        tableExists: supabaseMigrationTable.rows[0]?.exists === true,
        migration070000Recorded: supabaseRecorded.includes(migrationVersions[0]),
        migration070500Recorded: supabaseRecorded.includes(migrationVersions[1]),
      },
    };

    console.log('AFAQ_PROD_DB_VERIFY', JSON.stringify(result));

    const statePass =
      result.trustedDeviceTable &&
      result.oauthLoginAttemptTable &&
      result.allEightTablesHaveRls &&
      result.anonAuthenticatedTableGrantsAbsent &&
      result.defaultTableSequencePrivilegesLockedDown;

    if (!statePass) {
      throw new Error('Production database state does not satisfy the two migration outcomes');
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('AFAQ_PROD_DB_VERIFY_FAILED', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
