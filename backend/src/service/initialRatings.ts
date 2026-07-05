import { prisma } from './data';

/**
 * Rating bij de start van de competitie per deelnemer.
 * sevilla_initial_rating wordt gevuld bij inschrijving (snapshot van de rating op dat moment)
 * of door de Sevilla-import (IRtg). Deelnames van vóór deze snapshot-logica hebben geen waarde;
 * daarvoor valt de weergave terug op de live rating.
 */
export async function getInitialRatingsMap(
  tournamentIds: number[],
): Promise<Map<number, number>> {
  if (tournamentIds.length === 0) return new Map();

  const participations = await prisma.participation.findMany({
    where: {
      tournament_id: { in: tournamentIds },
      sevilla_initial_rating: { not: null },
    },
    select: {
      user_id: true,
      sevilla_initial_rating: true,
    },
  });

  return new Map(
    participations.map((p) => [p.user_id, p.sevilla_initial_rating as number]),
  );
}

/**
 * Vervang de live rating van een speler door de startrating van de competitie,
 * zodat de getoonde elo niet verandert wanneer de competitie wordt afgesloten.
 */
export function withInitialRating<
  T extends { user_id: number; schaakrating_elo: number } | null,
>(player: T, initialRatings: Map<number, number>): T {
  if (!player) return player;
  const initial = initialRatings.get(player.user_id);
  if (initial == null) return player;
  return { ...player, schaakrating_elo: initial };
}
