# Migration to PostgreSQL

The project is now configured to use PostgreSQL in all environments. This guide covers creating the production database and validating persistence.

## What changed

- `prisma/schema.prisma` provider switched from `sqlite` to `postgresql`.
- Old SQLite migrations were replaced with a single PostgreSQL baseline migration (`20250824000000_init_postgresql`).
- `lib/prisma.ts` now uses `@prisma/adapter-pg` with a `pg.Pool`.
- `better-sqlite3` and `@prisma/adapter-better-sqlite3` were removed; `pg` and `@prisma/adapter-pg` were added.
- `next.config.mjs` no longer marks SQLite packages as external.
- Admin seed and backup scripts load environment variables automatically.

## Local development

1. Start a PostgreSQL instance (port 5432) and create a database, e.g. `afaq`.
2. Copy `.env.example` to `.env` and set:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/afaq"
   ADMIN_SESSION_SECRET="a-secret-at-least-32-characters-long"
   UPLOAD_DIR="./public/uploads"
   MAX_FILE_SIZE="10485760"
   WHATSAPP_NUMBER="966567566616"
   NEXT_PUBLIC_WHATSAPP_NUMBER="966567566616"
   ```
3. Run migrations and start the dev server:
   ```bash
   npx prisma migrate deploy
   npm run dev
   ```

## Production provisioning (Vercel Marketplace)

The project is linked to Vercel project `dr-talal/afaq-creative`. Marketplace integrations require a human to accept legal terms, so this step must be completed in a browser or interactive terminal.

### Option A: Neon (recommended)

1. Accept the marketplace terms and install Neon:
   ```bash
   vercel integration accept-terms neon
   vercel integration add neon
   ```
2. In the Vercel dashboard, create a Neon resource for the project and copy the **DATABASE_URL**.
3. Set the connection string in Vercel:
   ```bash
   vercel env add DATABASE_URL production
   # or use the dashboard: Settings > Environment Variables
   ```
4. Re-deploy. `postbuild` will run `prisma migrate deploy` automatically.
5. Seed the admin user (run locally or from any machine with the Vercel env):
   ```bash
   vercel env pull .env.production
   npx tsx scripts/create-admin.ts admin@example.com "SecurePass123" "Admin Name"
   ```

### Option B: Prisma Postgres

1. Accept the marketplace terms and install Prisma Postgres:
   ```bash
   vercel integration accept-terms prisma/prisma-postgres
   vercel integration add prisma/prisma-postgres
   ```
2. Follow the dashboard prompts to create the database and obtain `DATABASE_URL`.
3. Set `DATABASE_URL` in Vercel and re-deploy.

### Option C: Supabase / other Postgres

Any Vercel Marketplace PostgreSQL integration works. After installing it, set `DATABASE_URL` and re-deploy.

## Validation checklist

After the production database is connected and the deployment finishes:

1. Open `https://afaq-global.com` and submit a new talent application.
2. Open `https://afaq-global.com/admin/login` and sign in.
3. Go to `https://afaq-global.com/admin/talents` and confirm the new application appears.
4. Wait a few minutes and refresh `/admin/talents`; the application should still be there across serverless invocations.
5. Trigger a new deploy; after it completes, confirm the data is still present.

## Rollback

If anything goes wrong, the previous SQLite environment variable value was:

```
DATABASE_URL=file:./dev.db
```

Restore it in Vercel and re-deploy. Note that data saved under the SQLite `/tmp` file is not persistent across Vercel invocations.

## Existing local data

A backup of the previous SQLite database and migrations was saved before the switch:

- `dev.db.backup.20260824`
- `prisma/migrations-sqlite-backup/`

To migrate local SQLite data into PostgreSQL, use a tool such as `pgloader` or export/import the tables manually.
