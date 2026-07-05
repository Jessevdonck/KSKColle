-- Backfill startrating voor bestaande deelnames zonder initial rating.
-- De getoonde elo binnen een competitie moet die van bij de start zijn en mag
-- niet veranderen bij het afsluiten. Voor lopende (niet-afgesloten) toernooien
-- is de huidige rating nog gelijk aan de startrating, dus die kunnen we veilig
-- als snapshot overnemen. Afgesloten toernooien laten we ongemoeid: daar is de
-- startrating niet meer te achterhalen (tenzij Sevilla ze al had ingevuld).
UPDATE Participation p
JOIN Tournament t ON t.tournament_id = p.tournament_id
JOIN User u ON u.user_id = p.user_id
SET p.sevilla_initial_rating = u.schaakrating_elo
WHERE p.sevilla_initial_rating IS NULL
  AND t.finished = false;
