/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `user` MODIFY `email` VARCHAR(255) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `idx_user_email_unique` ON `User`(`email`);
