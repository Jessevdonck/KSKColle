import { prisma } from './data';
import handleDBError from './handleDBError';

export interface PodiumEntry {
  user_id: number;
  position: number; // 1, 2 of 3
}

/**
 * Leg het podium van een afgesloten toernooi vast in de erelijst.
 * Wordt aangeroepen bij het afsluiten; bestaande entries voor dit toernooi
 * worden vervangen zodat opnieuw afsluiten geen duplicaten oplevert.
 *
 * Als de client geen podium meestuurt, wordt een fallback berekend op basis
 * van de deelnamegegevens (score, tie-break, wins). De frontend-berekening
 * is leidend omdat die alle speciale gevallen kent (Lente SB², blitz, ...).
 */
export async function saveTournamentPodium(
  tournamentId: number,
  podium?: PodiumEntry[],
): Promise<void> {
  try {
    let entries = (podium ?? [])
      .filter((e) => e.position >= 1 && e.position <= 3)
      .slice(0, 3);

    if (entries.length === 0) {
      entries = await computeFallbackPodium(tournamentId);
    }

    if (entries.length === 0) return;

    // Alleen effectieve deelnemers kunnen op het podium staan
    const participants = await prisma.participation.findMany({
      where: { tournament_id: tournamentId },
      select: { user_id: true },
    });
    const participantIds = new Set(participants.map((p) => p.user_id));
    entries = entries.filter((e) => participantIds.has(e.user_id));

    // Jaar van afsluiting: datum van de laatste ronde, anders vandaag
    const lastRound = await prisma.round.findFirst({
      where: { tournament_id: tournamentId },
      orderBy: { ronde_datum: 'desc' },
      select: { ronde_datum: true },
    });
    const jaar = (lastRound?.ronde_datum ?? new Date()).getFullYear();

    await prisma.$transaction([
      prisma.tournamentHonor.deleteMany({
        where: { tournament_id: tournamentId },
      }),
      prisma.tournamentHonor.createMany({
        data: entries.map((e) => ({
          tournament_id: tournamentId,
          user_id: e.user_id,
          position: e.position,
          jaar,
        })),
      }),
    ]);
  } catch (error) {
    throw handleDBError(error);
  }
}

/**
 * Fallback wanneer geen podium is meegestuurd: top 3 op score,
 * dan tie-break, dan aantal overwinningen.
 */
async function computeFallbackPodium(
  tournamentId: number,
): Promise<PodiumEntry[]> {
  const participations = await prisma.participation.findMany({
    where: { tournament_id: tournamentId },
    select: {
      user_id: true,
      score: true,
      tie_break: true,
      wins: true,
    },
  });

  return participations
    .sort(
      (a, b) =>
        (b.score ?? 0) - (a.score ?? 0) ||
        (b.tie_break ?? 0) - (a.tie_break ?? 0) ||
        (b.wins ?? 0) - (a.wins ?? 0),
    )
    .slice(0, 3)
    .map((p, index) => ({ user_id: p.user_id, position: index + 1 }));
}

/**
 * Palmares van één speler: alle podiumplaatsen, meest recente eerst.
 */
export async function getHonorsForUser(userId: number) {
  try {
    return await prisma.tournamentHonor.findMany({
      where: { user_id: userId },
      select: {
        honor_id: true,
        position: true,
        jaar: true,
        tournament: {
          select: {
            tournament_id: true,
            naam: true,
            class_name: true,
            is_youth: true,
          },
        },
      },
      orderBy: [{ jaar: 'desc' }, { position: 'asc' }],
    });
  } catch (error) {
    throw handleDBError(error);
  }
}

/**
 * Alle automatisch vastgelegde podia, gegroepeerd per toernooi
 * (voor de erelijsten-pagina).
 */
export async function getAllHonors() {
  try {
    const honors = await prisma.tournamentHonor.findMany({
      select: {
        honor_id: true,
        position: true,
        jaar: true,
        tournament: {
          select: {
            tournament_id: true,
            naam: true,
            class_name: true,
            is_youth: true,
          },
        },
        user: {
          select: {
            user_id: true,
            voornaam: true,
            achternaam: true,
          },
        },
      },
      orderBy: [{ jaar: 'desc' }, { tournament_id: 'desc' }, { position: 'asc' }],
    });

    // Groepeer per toernooi zodat de frontend één rij per toernooi kan tonen
    const byTournament = new Map<
      number,
      {
        tournament_id: number;
        naam: string;
        class_name: string | null;
        is_youth: boolean;
        jaar: number;
        podium: Array<{
          position: number;
          user: { user_id: number; voornaam: string; achternaam: string };
        }>;
      }
    >();

    for (const honor of honors) {
      const t = honor.tournament;
      let entry = byTournament.get(t.tournament_id);
      if (!entry) {
        entry = {
          tournament_id: t.tournament_id,
          naam: t.naam,
          class_name: t.class_name,
          is_youth: t.is_youth,
          jaar: honor.jaar,
          podium: [],
        };
        byTournament.set(t.tournament_id, entry);
      }
      entry.podium.push({ position: honor.position, user: honor.user });
    }

    return [...byTournament.values()];
  } catch (error) {
    throw handleDBError(error);
  }
}
