import { prisma } from './data';
import handleDBError from './handleDBError';
import { countsForBlitz } from '../core/ratedCompetitions';

/**
 * Aparte blitzrating, los van de ELIO.
 *
 * De volledige reeks wordt telkens opnieuw berekend uit alle blitz-/snelschaak-
 * toernooien (ook nog niet afgesloten: enkel gespeelde partijen tellen), chronologisch (datum van het toernooi, dan id).
 * Zo blijft het resultaat hetzelfde, ook als er later een oud toernooi
 * bijkomt of een uitslag wordt rechtgezet.
 *
 * - Elo met K = 32, verwachte score op basis van de rating vóór het toernooi
 *   (zelfde aanpak als finalizeTournamentRatings voor de ELIO).
 * - Enkel echt gespeelde uitslagen tellen: forfaits/reglementaire uitslagen
 *   ("...R", "...FF"), byes en afwezigheden niet.
 * - Startwaarde bij iemands eerste blitztoernooi: de beginrating uit Sevilla
 *   (= ELIO op dat moment), anders de laatste ELIO-historiek vóór het toernooi,
 *   anders de huidige ELIO, anders 1200.
 */
const K_FACTOR = 32;
const DEFAULT_START = 1200;

const periodOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

/** Score van speler 1 voor een echt gespeelde partij, of null als ze niet telt. */
function ratedScore(result: string | null): number | null {
  switch ((result ?? '').replace(/\s+/g, '')) {
    case '1-0':
      return 1;
    case '0-1':
      return 0;
    case '1/2-1/2':
    case '½-½':
      return 0.5;
    default:
      return null;
  }
}

export async function recalculateBlitzRatings(): Promise<{ tournaments: number; points: number }> {
  try {
    const tournaments = (
      await prisma.tournament.findMany({
        where: { is_youth: false },
        select: {
          tournament_id: true,
          naam: true,
          rounds: {
            select: {
              ronde_datum: true,
              type: true,
              games: { select: { speler1_id: true, speler2_id: true, result: true } },
            },
          },
          participations: { select: { user_id: true, sevilla_initial_rating: true } },
        },
      })
    )
      .filter((t) => countsForBlitz(t.naam))
      .map((t) => ({
        ...t,
        date: t.rounds.reduce<Date | null>((min, r) => (!min || r.ronde_datum < min ? r.ronde_datum : min), null),
      }))
      .filter((t) => t.date !== null)
      .sort((a, b) => a.date!.getTime() - b.date!.getTime() || a.tournament_id - b.tournament_id);

    // startwaarden
    const userIds = [...new Set(tournaments.flatMap((t) => t.participations.map((p) => p.user_id)))];
    const users = await prisma.user.findMany({
      where: { user_id: { in: userIds } },
      select: { user_id: true, schaakrating_elo: true, eloHistory: { select: { period: true, rating: true } } },
    });
    const userById = new Map(users.map((u) => [u.user_id, u]));

    const current = new Map<number, number>();
    const rows: Array<{
      user_id: number;
      tournament_id: number;
      period: string;
      rating: number;
      rating_change: number;
      games: number;
    }> = [];

    for (const t of tournaments) {
      const period = periodOf(t.date!);
      for (const p of t.participations) {
        if (current.has(p.user_id)) continue;
        const u = userById.get(p.user_id);
        const lastElio = u?.eloHistory
          .filter((h) => h.period <= period && h.rating > 0)
          .sort((a, b) => b.period.localeCompare(a.period))[0]?.rating;
        const start =
          (p.sevilla_initial_rating && p.sevilla_initial_rating > 0 ? p.sevilla_initial_rating : null) ??
          lastElio ??
          (u && u.schaakrating_elo > 0 ? u.schaakrating_elo : null) ??
          DEFAULT_START;
        current.set(p.user_id, start);
      }

      const stats = new Map<number, { score: number; expected: number; games: number }>();
      const stat = (id: number) => {
        let s = stats.get(id);
        if (!s) stats.set(id, (s = { score: 0, expected: 0, games: 0 }));
        return s;
      };
      for (const round of t.rounds) {
        if (round.type === 'MAKEUP') continue; // inhaaldagen bevatten kopieën van gewone partijen
        for (const g of round.games) {
          if (g.speler2_id == null) continue;
          const s1 = ratedScore(g.result);
          if (s1 === null) continue;
          const r1 = current.get(g.speler1_id);
          const r2 = current.get(g.speler2_id);
          if (r1 === undefined || r2 === undefined) continue;
          const e1 = 1 / (1 + 10 ** ((r2 - r1) / 400));
          const a = stat(g.speler1_id);
          const b = stat(g.speler2_id);
          a.score += s1;
          a.expected += e1;
          a.games++;
          b.score += 1 - s1;
          b.expected += 1 - e1;
          b.games++;
        }
      }

      for (const [userId, s] of stats) {
        const delta = Math.round(K_FACTOR * (s.score - s.expected));
        const rating = current.get(userId)! + delta;
        current.set(userId, rating);
        rows.push({ user_id: userId, tournament_id: t.tournament_id, period, rating, rating_change: delta, games: s.games });
      }
    }

    await prisma.$transaction([
      prisma.blitzRatingHistory.deleteMany({}),
      prisma.blitzRatingHistory.createMany({ data: rows }),
    ]);
    return { tournaments: tournaments.length, points: rows.length };
  } catch (error) {
    throw handleDBError(error);
  }
}

/**
 * Huidige (laatste punt) en hoogste blitzrating per speler, met het verschil van het
 * laatste blitztoernooi. Spelers zonder
 * blitztoernooi staan niet in de map. Zonder userIds: alle spelers.
 */
export async function getCurrentBlitzRatings(
  userIds?: number[],
): Promise<Map<number, { rating: number; max: number; change: number }>> {
  try {
    const rows = await prisma.blitzRatingHistory.findMany({
      where: userIds ? { user_id: { in: userIds } } : {},
      select: { user_id: true, period: true, rating: true, rating_change: true, tournament_id: true },
      orderBy: [{ period: 'asc' }, { tournament_id: 'asc' }],
    });
    const out = new Map<number, { rating: number; max: number; change: number }>();
    for (const r of rows) {
      const prev = out.get(r.user_id);
      // laatste wint
      out.set(r.user_id, { rating: r.rating, max: Math.max(prev?.max ?? r.rating, r.rating), change: r.rating_change });
    }
    return out;
  } catch (error) {
    throw handleDBError(error);
  }
}

/** Blitzrating-historiek van een speler, chronologisch. */
export async function getBlitzHistoryForUser(userId: number) {
  try {
    const rows = await prisma.blitzRatingHistory.findMany({
      where: { user_id: userId },
      select: {
        period: true,
        rating: true,
        rating_change: true,
        games: true,
        tournament: { select: { tournament_id: true, naam: true, class_name: true } },
      },
    });
    return rows.sort((a, b) => a.period.localeCompare(b.period) || a.tournament.tournament_id - b.tournament.tournament_id);
  } catch (error) {
    throw handleDBError(error);
  }
}
