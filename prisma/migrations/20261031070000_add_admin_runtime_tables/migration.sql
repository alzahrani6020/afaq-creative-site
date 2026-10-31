-- Add admin runtime tables present in prisma/schema.prisma but missing from migration history.
-- Verified against AFAQ Preview before commit.

CREATE TABLE "TrustedDevice" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    CONSTRAINT "TrustedDevice_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TrustedDevice_adminUserId_idx" ON "TrustedDevice"("adminUserId");
CREATE INDEX "TrustedDevice_expiresAt_idx" ON "TrustedDevice"("expiresAt");

ALTER TABLE "TrustedDevice"
ADD CONSTRAINT "TrustedDevice_adminUserId_fkey"
FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "OAuthLoginAttempt" (
    "id" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "detail" TEXT,
    "hasCode" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OAuthLoginAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OAuthLoginAttempt_createdAt_idx" ON "OAuthLoginAttempt"("createdAt");
