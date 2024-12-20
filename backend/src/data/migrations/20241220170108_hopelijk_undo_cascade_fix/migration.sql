-- DropForeignKey
ALTER TABLE `game` DROP FOREIGN KEY `Game_round_id_fkey`;

-- DropForeignKey
ALTER TABLE `round` DROP FOREIGN KEY `Round_tournament_id_fkey`;

-- AddForeignKey
ALTER TABLE `Round` ADD CONSTRAINT `Round_tournament_id_fkey` FOREIGN KEY (`tournament_id`) REFERENCES `Tournament`(`tournament_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Game` ADD CONSTRAINT `Game_round_id_fkey` FOREIGN KEY (`round_id`) REFERENCES `Round`(`round_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
