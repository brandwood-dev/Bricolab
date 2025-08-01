-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('PARTICULIER', 'ENTREPRISE');

-- CreateEnum
CREATE TYPE "Country" AS ENUM ('Kuwait');

-- CreateEnum
CREATE TYPE "Prefix" AS ENUM ('+965');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "type" "UserType",
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "country" "Country" NOT NULL,
    "prefix" "Prefix" NOT NULL,
    "phoneNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
