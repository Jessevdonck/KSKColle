-- DropForeignKey
ALTER TABLE `game` DROP FOREIGN KEY `Game_speler2_id_fkey`;

-- AlterTable
ALTER TABLE `game` MODIFY `speler2_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Game` ADD CONSTRAINT `Game_speler2_id_fkey` FOREIGN KEY (`speler2_id`) REFERENCES `User`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;
