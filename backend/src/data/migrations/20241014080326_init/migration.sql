/*
  Warnings:

  - Added the required column `schaakrating_difference` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `user` ADD COLUMN `schaakrating_difference` INTEGER NOT NULL;
