-- AlterTable
ALTER TABLE "User" ADD COLUMN     "verified_email" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verify_token" TEXT;
