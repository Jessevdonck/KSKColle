-- Erelijst/palmares: podiumplaatsen die bij het afsluiten van een toernooi
-- automatisch worden vastgelegd. Getoond op de erelijsten-pagina en op profielen.
CREATE TABLE TournamentHonor (
    honor_id INTEGER NOT NULL AUTO_INCREMENT,
    tournament_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    position INTEGER NOT NULL,
    jaar INTEGER NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (honor_id),
    UNIQUE INDEX TournamentHonor_tournament_id_position_key (tournament_id, position),
    INDEX TournamentHonor_user_id_idx (user_id),
    INDEX TournamentHonor_jaar_idx (jaar),
    CONSTRAINT TournamentHonor_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES Tournament (tournament_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT TournamentHonor_user_id_fkey FOREIGN KEY (user_id) REFERENCES User (user_id) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
