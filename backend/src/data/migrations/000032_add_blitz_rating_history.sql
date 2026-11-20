-- Aparte blitzrating (blitz-/snelschaakkampioenschap), los van de ELIO.
-- Eén punt per speler per afgesloten blitztoernooi; gevuld door blitzRatingService.
CREATE TABLE BlitzRatingHistory (
    blitz_history_id INTEGER NOT NULL AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    tournament_id INTEGER NOT NULL,
    period VARCHAR(191) NOT NULL,
    rating INTEGER NOT NULL,
    rating_change INTEGER NOT NULL,
    games INTEGER NOT NULL,

    PRIMARY KEY (blitz_history_id),
    UNIQUE INDEX BlitzRatingHistory_user_id_tournament_id_key (user_id, tournament_id),
    INDEX BlitzRatingHistory_user_id_idx (user_id),
    CONSTRAINT BlitzRatingHistory_user_id_fkey FOREIGN KEY (user_id) REFERENCES User (user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT BlitzRatingHistory_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES Tournament (tournament_id) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
