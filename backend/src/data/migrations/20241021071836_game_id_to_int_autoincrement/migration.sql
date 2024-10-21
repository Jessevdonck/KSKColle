/*
  Warnings:

  - The primary key for the `game` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `game_id` on the `game` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- AlterTable
ALTER TABLE `game` DROP PRIMARY KEY,
    MODIFY `game_id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`game_id`);
