-- AlterTable
ALTER TABLE `participation` ADD COLUMN `buchholz` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `bye_round` INTEGER NULL,
    ADD COLUMN `color_history` VARCHAR(191) NOT NULL DEFAULT '[]',
    ADD COLUMN `opponents` VARCHAR(191) NOT NULL DEFAULT '[]',
    ADD COLUMN `score` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `sonnebornBerger` DOUBLE NOT NULL DEFAULT 0;
