import { prisma } from "../data";

import { DEFAULT_CONFIG, type MegaschaakConfig } from "./types";
import { megaschaakRoundTypesFilter } from "./constants";
import { collectDedupedMegaschaakGames } from "./games";

export const getMegaschaakConfig = async (
  tournamentIds: number[],
  className?: string,
): Promise<MegaschaakConfig> => {
  if (tournamentIds.length === 0) {
    return DEFAULT_CONFIG;
  }

  try {
    // Get all tournaments to determine default rounds per class
    const tournaments = await prisma.tournament.findMany({
      where: { tournament_id: { in: tournamentIds } },
      select: {
        megaschaak_config: true,
        rondes: true,
        class_name: true,
      },
    });

    // Build default roundsPerClass from tournament data
    const defaultRoundsPerClass: { [key: string]: number } = {};
    tournaments.forEach((t) => {
      if (t.class_name && t.rondes) {
        defaultRoundsPerClass[t.class_name] = t.rondes;
      }
    });

    // If a specific class is requested and we have its tournament, use its rounds
    if (className) {
      const classTournament = tournaments.find(
        (t) => t.class_name === className,
      );
      if (classTournament && classTournament.rondes) {
        defaultRoundsPerClass[className] = classTournament.rondes;
      }
    }

    // Find the first tournament with a config (config should be the same for all tournaments with same name)
    const tournamentWithConfig =
      tournaments.find((t) => t.megaschaak_config !== null) || tournaments[0];
    if (tournamentWithConfig?.megaschaak_config) {
      const config = tournamentWithConfig.megaschaak_config as any;
      return {
        classBonusPoints: {
          ...DEFAULT_CONFIG.classBonusPoints,
          ...(config.classBonusPoints || {}),
        },
        roundsPerClass: {
          ...defaultRoundsPerClass,
          ...(config.roundsPerClass || {}),
        },
        correctieMultiplier:
          config.correctieMultiplier ?? DEFAULT_CONFIG.correctieMultiplier,
        correctieSubtract:
          config.correctieSubtract ?? DEFAULT_CONFIG.correctieSubtract,
        minCost: config.minCost ?? DEFAULT_CONFIG.minCost,
        maxCost: config.maxCost ?? DEFAULT_CONFIG.maxCost,
        playerCosts: config.playerCosts || undefined, // Include playerCosts if present
      };
    }

    // Return config with default rounds from tournaments
    return {
      ...DEFAULT_CONFIG,
      roundsPerClass: defaultRoundsPerClass,
    };
  } catch (error) {
    console.error("Error loading megaschaak config:", error);
  }

  return DEFAULT_CONFIG;
};

/**
 * Calculate bonus points based on class using configuration
 */
const getBonusPointsByClass = (
  className: string,
  config: MegaschaakConfig,
): number => {
  return config.classBonusPoints[className] || 0;
};

/**
 * Calculate TPR (Tournament Performance Rating) for a player
 * Based on performance in the latest Herfstcompetitie or Lentecompetitie tournament
 * @param playerId - The player's user ID
 * @param tournamentType - 'herfst' for Herfstcompetitie, 'lente' for Lentecompetitie, or undefined to auto-detect
 */
const calculateTPR = async (
  playerId: number,
  tournamentType?: "herfst" | "lente",
): Promise<number> => {
  try {
    // Get player's current rating as fallback
    const player = await prisma.user.findUnique({
      where: { user_id: playerId },
      select: { schaakrating_elo: true },
    });
    const fallbackRating = player?.schaakrating_elo || 1500;

    // Determine which tournament type to use
    const useHerfst =
      tournamentType === "herfst" || tournamentType === undefined;
    const useLente = tournamentType === "lente" || tournamentType === undefined;

    // Build search terms (MySQL doesn't support case-insensitive mode, so we'll filter in JavaScript)
    const searchTerms: string[] = [];
    if (useHerfst) {
      searchTerms.push("herfst", "herfstcompetitie");
    }
    if (useLente) {
      searchTerms.push("lente", "lentecompetitie");
    }

    if (searchTerms.length === 0) {
      // No tournament type specified, return current rating
      return fallbackRating;
    }

    // Find all tournaments (MySQL doesn't support case-insensitive contains, so we'll filter in JavaScript)
    const allTournamentsRaw = await prisma.tournament.findMany({
      where: {
        OR: searchTerms.map((term) => ({
          naam: { contains: term },
        })),
      },
      include: {
        rounds: {
          where: { type: megaschaakRoundTypesFilter },
          include: {
            games: {
              where: {
                OR: [{ speler1_id: playerId }, { speler2_id: playerId }],
              },
              include: {
                speler1: {
                  select: { schaakrating_elo: true },
                },
                speler2: {
                  select: { schaakrating_elo: true },
                },
              },
            },
          },
          orderBy: {
            ronde_datum: "desc",
          },
        },
      },
      orderBy: {
        tournament_id: "desc",
      },
    });

    // Filter tournaments case-insensitively in JavaScript (MySQL limitation)
    const allTournaments = allTournamentsRaw.filter((tournament: any) => {
      const naamLower = tournament.naam.toLowerCase();
      return searchTerms.some((term: string) =>
        naamLower.includes(term.toLowerCase()),
      );
    });

    // Find the tournament with the latest round date
    let latestTournament: (typeof allTournaments)[0] | null = null;
    let latestDate: Date | null = null;

    for (const tournament of allTournaments) {
      if (tournament.rounds.length > 0 && tournament.rounds[0]) {
        const lastRoundDate = tournament.rounds[0].ronde_datum;
        if (!latestDate || lastRoundDate > latestDate) {
          latestTournament = tournament;
          latestDate = lastRoundDate;
        }
      } else if (!latestTournament) {
        // Fallback to tournament_id if no rounds
        latestTournament = tournament;
      }
    }

    if (!latestTournament) {
      // No tournament found, return current rating
      return fallbackRating;
    }

    // Get the player's participation to find their initial rating
    const participation = await prisma.participation.findUnique({
      where: {
        user_id_tournament_id: {
          user_id: playerId,
          tournament_id: latestTournament.tournament_id,
        },
      },
      select: {
        sevilla_initial_rating: true,
      },
    });

    // If player didn't participate in the tournament, TPR = ELO
    if (!participation) {
      return fallbackRating;
    }

    // Use initial rating from tournament if available, otherwise use current rating
    const playerRatingAtTournament =
      participation.sevilla_initial_rating || fallbackRating;

    // Reguliere rondes; inhaaluitslag via original_game_id. Elk koppel één keer.
    const allGames = (
      await collectDedupedMegaschaakGames([latestTournament])
    ).filter((g) => g.speler1_id === playerId || g.speler2_id === playerId);

    if (allGames.length === 0) {
      // No games played, return current rating (TPR = ELO)
      return fallbackRating;
    }

    // Get all participations for this tournament to get opponent ratings at tournament start
    const allParticipations = await prisma.participation.findMany({
      where: {
        tournament_id: latestTournament.tournament_id,
      },
      select: {
        user_id: true,
        sevilla_initial_rating: true,
      },
    });

    // Create a map of user_id -> initial rating
    const initialRatings = new Map<number, number>();
    for (const p of allParticipations) {
      initialRatings.set(p.user_id, p.sevilla_initial_rating || fallbackRating);
    }

    // Calculate TPR: TPR = Ra + 400 * (Sa - Se)
    // Where:
    // - Ra = average opponent rating
    // - Sa = actual score
    // - Se = expected score

    let totalOpponentRating = 0;
    let actualScore = 0;
    let expectedScore = 0;
    let gamesCounted = 0;

    for (const game of allGames) {
      // Skip BYE games (no opponent)
      if (!game.speler2_id || !game.speler2) {
        continue;
      }

      const isPlayer1 = game.speler1_id === playerId;
      const opponentId = isPlayer1 ? game.speler2_id : game.speler1_id;

      if (!opponentId) {
        continue;
      }

      // Use opponent's initial rating from tournament if available, otherwise current rating
      const opponentRating =
        initialRatings.get(opponentId) ||
        (isPlayer1
          ? game.speler2?.schaakrating_elo
          : game.speler1?.schaakrating_elo) ||
        1500;

      // Calculate expected score for this game
      const ratingDiff = isPlayer1
        ? opponentRating - playerRatingAtTournament
        : playerRatingAtTournament - opponentRating;
      const expected = 1 / (1 + Math.pow(10, ratingDiff / 400));

      // Calculate actual score
      let actual = 0;
      if (game.result === "1-0" || game.result === "1-0R") {
        actual = isPlayer1 ? 1 : 0;
      } else if (game.result === "0-1" || game.result === "0-1R") {
        actual = isPlayer1 ? 0 : 1;
      } else if (game.result === "1/2-1/2" || game.result === "½-½") {
        actual = 0.5;
      } else if (game.result && game.result.includes("ABS")) {
        // Absent with message - extract score if possible
        const absMatch = game.result.match(/ABS-?(\d+\.?\d*)/);
        if (absMatch && absMatch[1]) {
          actual = parseFloat(absMatch[1]) || 0;
        }
      }

      totalOpponentRating += opponentRating;
      actualScore += actual;
      expectedScore += expected;
      gamesCounted++;
    }

    if (gamesCounted === 0) {
      // No valid games, return current rating (TPR = ELO)
      return fallbackRating;
    }

    // Calculate average opponent rating
    const averageOpponentRating = totalOpponentRating / gamesCounted;

    // Calculate TPR
    const tpr = averageOpponentRating + 400 * (actualScore - expectedScore);

    // Return rounded TPR, with reasonable bounds
    return Math.max(0, Math.min(3000, Math.round(tpr)));
  } catch (error) {
    console.error("Error calculating TPR:", error);
    // Fallback to current rating
    const player = await prisma.user.findUnique({
      where: { user_id: playerId },
      select: { schaakrating_elo: true },
    });
    return player?.schaakrating_elo || 1500;
  }
};

/**
 * Calculate megaschaak cost using the Excel formulas
 */
export const calculatePlayerCost = async (
  playerId: number,
  className: string,
  tournamentIds: number[],
): Promise<number> => {
  try {
    // Get megaschaak configuration (pass className to get correct rounds)
    const config = await getMegaschaakConfig(tournamentIds, className);

    // Check if there's a manual price set for this player (from Excel import)
    // JSON keys are strings, so check both number and string key
    if (config.playerCosts) {
      const playerCosts = config.playerCosts as Record<string | number, number>;
      const cost = playerCosts[playerId] ?? playerCosts[String(playerId)];
      if (cost !== undefined && cost !== null) {
        return Number(cost);
      }
    }

    // Get player rating
    const player = await prisma.user.findUnique({
      where: { user_id: playerId },
      select: { schaakrating_elo: true },
    });

    if (!player) return 50; // Default fallback

    const rating = player.schaakrating_elo;

    // Determine tournament type from tournamentIds
    let tournamentType: "herfst" | "lente" | undefined = undefined;
    if (tournamentIds.length > 0) {
      const tournament = await prisma.tournament.findFirst({
        where: { tournament_id: { in: tournamentIds } },
        select: { naam: true },
      });

      if (tournament) {
        const name = tournament.naam.toLowerCase();
        if (name.includes("herfst") || name.includes("herfstcompetitie")) {
          tournamentType = "herfst";
        } else if (name.includes("lente") || name.includes("lentecompetitie")) {
          tournamentType = "lente";
        }
      }
    }

    // 1. Bonus Pt(kl) based on class (using config)
    const bonusPoints = getBonusPointsByClass(className, config);

    // 2. Calculate TPR based on tournament type
    const tpr = await calculateTPR(playerId, tournamentType);

    // 3. Pt(ELO) = (Rating + TPR) / 2
    const ptELO = (rating + tpr) / 2;

    // 4. Pt(tot) = Bonus Pt(kl) + Pt(ELO)
    const ptTot = bonusPoints + ptELO;

    // 5. Correctie = Pt(tot) * multiplier - subtract (using config)
    const correctie =
      ptTot * config.correctieMultiplier - config.correctieSubtract;

    // 6. Get number of rounds for this class (from config or tournament default)
    const numberOfRounds = config.roundsPerClass[className] || 10; // Default to 10 if not configured

    // 7. Megaschaak kost = MROUND(Correctie, 10) / aantal_rondes (afgerond naar geheel getal)
    const megaschaakCost = (Math.round(correctie / 10) * 10) / numberOfRounds;

    // Round to nearest whole number
    const roundedCost = Math.round(megaschaakCost);

    // Ensure cost is within configured bounds
    return Math.max(config.minCost, Math.min(config.maxCost, roundedCost));
  } catch (error) {
    console.error("Error calculating player cost:", error);
    // Fallback to simple rating-based calculation
    const rating = 1500; // Default fallback
    if (rating < 1500) return 50;
    if (rating < 1700) return 100;
    if (rating < 2000) return 150;
    return 200;
  }
};
