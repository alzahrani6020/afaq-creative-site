-- AFAQ server-side Prisma hardening for Supabase exposed public schema.
-- No browser/client table access is required; RLS remains enabled with no client policies.

ALTER TABLE "TalentApplication" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdminUser" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TalentApplicationActivity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdminActivity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ApplicantSkillProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailVerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TrustedDevice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OAuthLoginAttempt" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "TalentApplication" FROM anon, authenticated;
REVOKE ALL ON TABLE "AdminUser" FROM anon, authenticated;
REVOKE ALL ON TABLE "TalentApplicationActivity" FROM anon, authenticated;
REVOKE ALL ON TABLE "AdminActivity" FROM anon, authenticated;
REVOKE ALL ON TABLE "ApplicantSkillProfile" FROM anon, authenticated;
REVOKE ALL ON TABLE "EmailVerificationToken" FROM anon, authenticated;
REVOKE ALL ON TABLE "TrustedDevice" FROM anon, authenticated;
REVOKE ALL ON TABLE "OAuthLoginAttempt" FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE USAGE, SELECT ON SEQUENCES FROM anon, authenticated;
