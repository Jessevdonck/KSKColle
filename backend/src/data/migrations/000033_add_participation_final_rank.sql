-- Officiële eindrang per deelname (1 = winnaar), vastgelegd bij het afsluiten van een
-- toernooi met dezelfde berekening als de getoonde eindstand. Gebruikt voor de
-- palmares-tabel op het profiel.
ALTER TABLE Participation ADD COLUMN final_rank INTEGER NULL;
