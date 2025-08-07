/*
  Warnings:

  - You are about to alter the column `comment` on the `AppRating` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(300)`.
  - You are about to alter the column `comment` on the `ToolRating` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(300)`.

*/
-- DropIndex
DROP INDEX "AppRating_userId_key";

-- AlterTable
ALTER TABLE "AppRating" ALTER COLUMN "comment" SET DATA TYPE VARCHAR(300);

-- AlterTable
ALTER TABLE "ToolRating" ALTER COLUMN "comment" SET DATA TYPE VARCHAR(300);
