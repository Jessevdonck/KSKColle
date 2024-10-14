-- CreateTable
CREATE TABLE `User` (
    `user_id` INTEGER NOT NULL AUTO_INCREMENT,
    `voornaam` VARCHAR(191) NOT NULL,
    `achternaam` VARCHAR(191) NOT NULL,
    `leeftijd` INTEGER NOT NULL,
    `schaakrating_elo` INTEGER NOT NULL,
    `is_admin` BOOLEAN NOT NULL,
    `fide_id` INTEGER NOT NULL,
    `nationaal_id` INTEGER NOT NULL,
    `lid_sinds` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_fide_id_key`(`fide_id`),
    UNIQUE INDEX `User_nationaal_id_key`(`nationaal_id`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tournament` (
    `tournament_id` VARCHAR(191) NOT NULL,
    `naam` VARCHAR(191) NOT NULL,
    `rondes` INTEGER NOT NULL,

    PRIMARY KEY (`tournament_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Round` (
    `round_id` VARCHAR(191) NOT NULL,
    `tournament_id` VARCHAR(191) NOT NULL,
    `ronde_nummer` INTEGER NOT NULL,
    `ronde_datum` DATETIME(3) NOT NULL,

    PRIMARY KEY (`round_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Game` (
    `game_id` VARCHAR(191) NOT NULL,
    `round_id` VARCHAR(191) NOT NULL,
    `tournament_id` VARCHAR(191) NOT NULL,
    `speler1_id` INTEGER NOT NULL,
    `speler2_id` INTEGER NOT NULL,
    `winnaar_id` INTEGER NULL,
    `result` VARCHAR(191) NULL,
    `uitgestelde_datum` DATETIME(3) NULL,

    PRIMARY KEY (`game_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Participation` (
    `user_id` INTEGER NOT NULL,
    `tournament_id` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`user_id`, `tournament_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Round` ADD CONSTRAINT `Round_tournament_id_fkey` FOREIGN KEY (`tournament_id`) REFERENCES `Tournament`(`tournament_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Game` ADD CONSTRAINT `Game_round_id_fkey` FOREIGN KEY (`round_id`) REFERENCES `Round`(`round_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Game` ADD CONSTRAINT `Game_tournament_id_fkey` FOREIGN KEY (`tournament_id`) REFERENCES `Tournament`(`tournament_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Game` ADD CONSTRAINT `Game_speler1_id_fkey` FOREIGN KEY (`speler1_id`) REFERENCES `User`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Game` ADD CONSTRAINT `Game_speler2_id_fkey` FOREIGN KEY (`speler2_id`) REFERENCES `User`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Game` ADD CONSTRAINT `Game_winnaar_id_fkey` FOREIGN KEY (`winnaar_id`) REFERENCES `User`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Participation` ADD CONSTRAINT `Participation_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Participation` ADD CONSTRAINT `Participation_tournament_id_fkey` FOREIGN KEY (`tournament_id`) REFERENCES `Tournament`(`tournament_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
