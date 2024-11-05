/*
  Warnings:

  - You are about to drop the column `nationaal_id` on the `user` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `User_nationaal_id_key` ON `user`;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `nationaal_id`;
