/*
  Warnings:

  - The primary key for the `participation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `tournament_id` on the `participation` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `tournament_id` on the `round` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - The primary key for the `tournament` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `tournament_id` on the `tournament` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- DropForeignKey
ALTER TABLE `participation` DROP FOREIGN KEY `Participation_tournament_id_fkey`;

-- DropForeignKey
ALTER TABLE `round` DROP FOREIGN KEY `Round_tournament_id_fkey`;

-- AlterTable
ALTER TABLE `participation` DROP PRIMARY KEY,
    MODIFY `tournament_id` INTEGER NOT NULL,
    ADD PRIMARY KEY (`user_id`, `tournament_id`);

-- AlterTable
ALTER TABLE `round` MODIFY `tournament_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `tournament` DROP PRIMARY KEY,
    MODIFY `tournament_id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`tournament_id`);

-- AddForeignKey
ALTER TABLE `Round` ADD CONSTRAINT `Round_tournament_id_fkey` FOREIGN KEY (`tournament_id`) REFERENCES `Tournament`(`tournament_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Participation` ADD CONSTRAINT `Participation_tournament_id_fkey` FOREIGN KEY (`tournament_id`) REFERENCES `Tournament`(`tournament_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
