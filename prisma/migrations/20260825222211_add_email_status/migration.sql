-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('pending', 'sent', 'failed', 'verified');

-- AlterTable
ALTER TABLE "TalentApplication" ADD COLUMN     "emailStatus" "EmailStatus" NOT NULL DEFAULT 'pending',
ADD COLUMN     "emailSentAt" TIMESTAMP(3),
ADD COLUMN     "emailFailedAt" TIMESTAMP(3),
ADD COLUMN     "emailError" TEXT,
ADD COLUMN     "emailMessageId" TEXT,
ADD COLUMN     "adminNotified" BOOLEAN NOT NULL DEFAULT false;

-- Backfill existing records: if emailVerified is true, status is verified; otherwise keep pending.
UPDATE "TalentApplication"
SET "emailStatus" = 'verified'
WHERE "emailVerified" = true;
