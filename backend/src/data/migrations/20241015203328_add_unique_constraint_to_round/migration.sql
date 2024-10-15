/*
  Warnings:

  - A unique constraint covering the columns `[ronde_nummer,tournament_id]` on the table `Round` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `user` MODIFY `is_admin` BOOLEAN NULL,
    MODIFY `fide_id` INTEGER NULL,
    MODIFY `nationaal_id` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Round_ronde_nummer_tournament_id_key` ON `Round`(`ronde_nummer`, `tournament_id`);
