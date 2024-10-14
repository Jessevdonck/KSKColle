/*
  Warnings:

  - You are about to drop the column `leeftijd` on the `user` table. All the data in the column will be lost.
  - Added the required column `geboortedatum` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `user` DROP COLUMN `leeftijd`,
    ADD COLUMN `geboortedatum` DATETIME(3) NOT NULL;
