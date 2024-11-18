-- AlterTable
ALTER TABLE `participation` MODIFY `buchholz` DOUBLE NULL DEFAULT 0,
    MODIFY `color_history` VARCHAR(191) NULL DEFAULT '[]',
    MODIFY `opponents` VARCHAR(191) NULL DEFAULT '[]',
    MODIFY `score` DOUBLE NULL DEFAULT 0,
    MODIFY `sonnebornBerger` DOUBLE NULL DEFAULT 0;
