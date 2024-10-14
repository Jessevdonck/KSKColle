/*
  Warnings:

  - You are about to drop the column `tournament_id` on the `game` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `game` DROP FOREIGN KEY `Game_tournament_id_fkey`;

-- AlterTable
ALTER TABLE `game` DROP COLUMN `tournament_id`;
