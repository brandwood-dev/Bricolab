/*
  Warnings:

  - A unique constraint covering the columns `[refresh_token]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Country" ADD VALUE 'KSA';
ALTER TYPE "Country" ADD VALUE 'UAE';
ALTER TYPE "Country" ADD VALUE 'Qatar';
ALTER TYPE "Country" ADD VALUE 'Bahrain';
ALTER TYPE "Country" ADD VALUE 'Oman';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Prefix" ADD VALUE '+966';
ALTER TYPE "Prefix" ADD VALUE '+971';
ALTER TYPE "Prefix" ADD VALUE '+974';
ALTER TYPE "Prefix" ADD VALUE '+973';
ALTER TYPE "Prefix" ADD VALUE '+968';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "refresh_token" TEXT,
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';

-- CreateIndex
CREATE UNIQUE INDEX "User_refresh_token_key" ON "User"("refresh_token");
