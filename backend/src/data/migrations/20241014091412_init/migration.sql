/*
  Warnings:

  - You are about to alter the column `round_id` on the `game` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - The primary key for the `round` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `round_id` on the `round` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- DropForeignKey
ALTER TABLE `game` DROP FOREIGN KEY `Game_round_id_fkey`;

-- AlterTable
ALTER TABLE `game` MODIFY `round_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `round` DROP PRIMARY KEY,
    MODIFY `round_id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`round_id`);

-- AddForeignKey
ALTER TABLE `Game` ADD CONSTRAINT `Game_round_id_fkey` FOREIGN KEY (`round_id`) REFERENCES `Round`(`round_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
