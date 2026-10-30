-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('new', 'under_review', 'qualified', 'need_information', 'contacted', 'accepted', 'rejected');

-- CreateTable
CREATE TABLE "TalentApplication" (
    "id" TEXT NOT NULL,
    "applicationNumber" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "fields" TEXT NOT NULL,
    "specialized" TEXT NOT NULL,
    "personal" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "attachments" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'new',
    "adminNotes" TEXT,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "district" TEXT,
    "serviceArea" TEXT,
    "workPlace" TEXT,
    "sanaieePlatformConsent" BOOLEAN NOT NULL DEFAULT false,
    "sanaieeConsentAt" TIMESTAMP(3),
    "sanaieeProfileStatus" TEXT NOT NULL DEFAULT 'not_interested',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TalentApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalentApplicationActivity" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "adminUserId" TEXT,
    "action" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TalentApplicationActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminActivity" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicantSkillProfile" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "profileType" TEXT NOT NULL,
    "sector" TEXT,
    "profession" TEXT NOT NULL,
    "specializations" TEXT NOT NULL,
    "services" TEXT NOT NULL,
    "skillLevel" TEXT,
    "yearsExperience" TEXT,
    "description" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isCustomProfession" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" TEXT NOT NULL DEFAULT 'unverified',
    "customProfessionName" TEXT,
    "customProfessionLocalName" TEXT,
    "customProfessionDescription" TEXT,
    "customProfessionClosestSector" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicantSkillProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TalentApplication_applicationNumber_key" ON "TalentApplication"("applicationNumber");

-- CreateIndex
CREATE INDEX "TalentApplication_applicationNumber_idx" ON "TalentApplication"("applicationNumber");

-- CreateIndex
CREATE INDEX "TalentApplication_phone_idx" ON "TalentApplication"("phone");

-- CreateIndex
CREATE INDEX "TalentApplication_email_idx" ON "TalentApplication"("email");

-- CreateIndex
CREATE INDEX "TalentApplication_status_idx" ON "TalentApplication"("status");

-- CreateIndex
CREATE INDEX "TalentApplication_createdAt_idx" ON "TalentApplication"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "TalentApplicationActivity_applicationId_idx" ON "TalentApplicationActivity"("applicationId");

-- CreateIndex
CREATE INDEX "TalentApplicationActivity_createdAt_idx" ON "TalentApplicationActivity"("createdAt");

-- CreateIndex
CREATE INDEX "AdminActivity_adminUserId_idx" ON "AdminActivity"("adminUserId");

-- CreateIndex
CREATE INDEX "AdminActivity_createdAt_idx" ON "AdminActivity"("createdAt");

-- CreateIndex
CREATE INDEX "ApplicantSkillProfile_applicationId_idx" ON "ApplicantSkillProfile"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicantSkillProfile_isPrimary_idx" ON "ApplicantSkillProfile"("isPrimary");

-- AddForeignKey
ALTER TABLE "TalentApplicationActivity" ADD CONSTRAINT "TalentApplicationActivity_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "TalentApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentApplicationActivity" ADD CONSTRAINT "TalentApplicationActivity_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminActivity" ADD CONSTRAINT "AdminActivity_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicantSkillProfile" ADD CONSTRAINT "ApplicantSkillProfile_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "TalentApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
