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

export type PlacementCategory = 'herfst' | 'lente' | 'zomer' | 'blitz' | 'jeugd' | 'overige';

export interface Placement {
  tournament_id: number;
  naam: string;
  class_name: string | null;
  /** Jaar uit de toernooinaam (seizoen "Herfstcompetitie 2024-2025" -> 2025, zoals de erelijsten), anders van de laatste ronde */
  jaar: number | null;
  category: PlacementCategory;
  /** Eindrang (1 = winnaar) */
  rank: number;
  /** Gelijk geëindigd met andere spelers zonder beslissende tiebreak */
  shared: boolean;
  players: number;
}

const placementCategory = (naam: string, isYouth: boolean): PlacementCategory => {
  const n = naam.toLowerCase();
  if (isYouth || n.includes('jeugd')) return 'jeugd';
  if (n.includes('herfst')) return 'herfst';
  if (n.includes('lente')) return 'lente';
  if (n.includes('zomer')) return 'zomer';
  if (n.includes('blitz') || n.includes('snelschaak')) return 'blitz';
  return 'overige';
};

/**
 * Eindrang van een speler in elk afgesloten toernooi waaraan hij deelnam (palmares-tabel).
 *
 * Voorkeur: de officiële eindrang (final_rank, vastgelegd bij het afsluiten), dan een
 * vastgelegd podium (erelijst). Anders: 1 + aantal spelers met meer punten (bij gelijke
 * punten de opgeslagen tie-break, als beide die hebben); blijft het gelijk, dan is de
 * plaats gedeeld.
 */
export async function getPlacementsForUser(userId: number): Promise<Placement[]> {
  try {
    const mine = await prisma.participation.findMany({
      where: { user_id: userId, tournament: { finished: true } },
      select: { tournament_id: true },
    });
    const ids = mine.map((p) => p.tournament_id);
    if (ids.length === 0) return [];

    const [tournaments, honors] = await Promise.all([
      prisma.tournament.findMany({
        where: { tournament_id: { in: ids } },
        select: {
          tournament_id: true,
          naam: true,
          class_name: true,
          is_youth: true,
          participations: { select: { user_id: true, score: true, tie_break: true, final_rank: true } },
          rounds: { select: { ronde_datum: true }, orderBy: { ronde_datum: 'desc' }, take: 1 },
        },
      }),
      prisma.tournamentHonor.findMany({
        where: { tournament_id: { in: ids }, user_id: userId },
        select: { tournament_id: true, position: true },
      }),
    ]);
    const honorBy = new Map(honors.map((h) => [h.tournament_id, h.position]));

    return tournaments.map((t) => {
      const me = t.participations.find((p) => p.user_id === userId)!;
      const myScore = me.score ?? 0;
      let better = 0;
      let tied = 0;
      for (const p of t.participations) {
        if (p.user_id === userId) continue;
        const s = p.score ?? 0;
        if (s > myScore) better++;
        else if (s === myScore) {
          if (p.tie_break != null && me.tie_break != null && p.tie_break !== me.tie_break) {
            if (p.tie_break > me.tie_break) better++;
          } else {
            tied++;
          }
        }
      }
      const honor = honorBy.get(t.tournament_id);
      // Officiële eindrang (bij het afsluiten vastgelegd) gaat voor
      const official = me.final_rank ?? null;
      // Seizoenen ("Herfstcompetitie 2024-2025") tellen voor het eindjaar, zoals in de erelijsten
      const yearInName = t.naam.match(/(19|20)\d{2}/g)?.at(-1);
      const lastRound = t.rounds[0]?.ronde_datum;
      return {
        tournament_id: t.tournament_id,
        naam: t.naam,
        class_name: t.class_name,
        jaar: yearInName ? Number(yearInName) : lastRound ? lastRound.getFullYear() : null,
        category: placementCategory(t.naam, t.is_youth),
        rank: official ?? honor ?? better + 1,
        shared: official != null || honor != null ? false : tied > 0,
        players: t.participations.length,
      };
    });
  } catch (error) {
    throw handleDBError(error);
  }
}
