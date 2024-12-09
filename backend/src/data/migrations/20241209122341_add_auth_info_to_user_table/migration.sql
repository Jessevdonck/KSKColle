/*
  Warnings:

  - Added the required column `password_hash` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roles` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `user` ADD COLUMN `password_hash` VARCHAR(255) NOT NULL,
    ADD COLUMN `roles` JSON NOT NULL;
