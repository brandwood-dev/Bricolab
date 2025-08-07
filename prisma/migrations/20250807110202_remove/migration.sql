/*
  Warnings:

  - You are about to drop the `ToolRating` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ToolRating" DROP CONSTRAINT "ToolRating_toolId_fkey";

-- DropForeignKey
ALTER TABLE "ToolRating" DROP CONSTRAINT "ToolRating_userId_fkey";

-- DropTable
DROP TABLE "ToolRating";
