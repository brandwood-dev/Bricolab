/*
  Warnings:

  - A unique constraint covering the columns `[newEmail]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "newEmail" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_newEmail_key" ON "User"("newEmail");
