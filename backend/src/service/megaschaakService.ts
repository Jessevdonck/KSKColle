import { RoundType } from "@prisma/client";
import { prisma } from "./data";
import ServiceError from "../core/serviceError";
import handleDBError from "./handleDBError";

/** Alleen reguliere speeldagen in megaschaak; inhaaluitslagen koppelen we via original_game_id */
const megaschaakRoundTypesFilter = {
  in: [RoundType.REGULAR],
};

/**
 * Calculate the cost of a player based on their rating
 * Formula: Base cost based on rating with some logic
 */
/**
 * Default megaschaak formula configuration
 */
export interface MegaschaakConfig {
  classBonusPoints: { [key: string]: number };
  roundsPerClass: { [key: string]: number }; // Number of rounds per class
  correctieMultiplier: number; // Default: 1.5
  correctieSubtract: number; // Default: 1800
  minCost: number; // Default: 1
  maxCost: number; // Default: 200
  playerCosts?: { [playerId: number]: number }; // Handmatige prijzen per speler (optioneel)
}

/** Spelers die volledig afwezig zijn in megaschaak (buiten competitie, bv. Lode Van Landeghem) */
function isExcludedFromMegaschaak(
  voornaam: string,
  achternaam: string,
): boolean {
  const v = (voornaam || "").trim().toLowerCase();
  const a = (achternaam || "").trim().toLowerCase();
  if (v === "piet" && a === "vermeiren") return true; // bestaande uitsluiting lentecompetitie
  if (v === "lode" && (a.includes("landeghem") || a.includes("van landeghem")))
    return true;
  return false;
}

/**
 * Vaste user_id's die nooit in megaschaak-partijen mogen meetellen (naast DB-lookup op naam).
 * Vul aan met Lode Van Landeghem zodat het ook zonder brede user-query werkt.
 */
const MEGASCHAAT_EXCLUDED_FIXED_USER_IDS: readonly number[] = [];

let megaschaakExcludedUserIdsPromise: Promise<Set<number>> | null = null;

async function getMegaschaakExcludedUserIds(): Promise<Set<number>> {
  if (!megaschaakExcludedUserIdsPromise) {
    megaschaakExcludedUserIdsPromise = (async () => {
      const ids = new Set<number>([...MEGASCHAAT_EXCLUDED_FIXED_USER_IDS]);
      const candidates = await prisma.user.findMany({
        where: {
          OR: [
            { voornaam: { in: ["Lode", "LODE", "lode", "Piet", "piet"] } },
            { achternaam: { contains: "Landeghem" } },
            { achternaam: { contains: "landeghem" } },
            { achternaam: { contains: "Vermeiren" } },
          ],
        },
        select: { user_id: true, voornaam: true, achternaam: true },
      });
      for (const u of candidates) {
        if (isExcludedFromMegaschaak(u.voornaam || "", u.achternaam || "")) {
          ids.add(u.user_id);
        }
      }
      return ids;
    })();
  }
  return megaschaakExcludedUserIdsPromise;
}

function gameInvolvesMegaschaakExcludedPlayer(
  game: { speler1_id?: number | null; speler2_id?: number | null },
  excludedIds: Set<number>,
): boolean {
  const p1 = game.speler1_id;
  const p2 = game.speler2_id;
  if (p1 != null && excludedIds.has(p1)) return true;
  if (p2 != null && excludedIds.has(p2)) return true;
  return false;
}

const DEFAULT_CONFIG: MegaschaakConfig = {
  classBonusPoints: {
    "Eerste Klasse": 0,
    "Tweede Klasse": 110,
    "Derde Klasse": 190,
    "Vierde Klasse": 270,
    "Vijfde Klasse": 330,
    "Vierde en Vijfde Klasse": 330,
    "Zesde Klasse": 330,
    "Zevende Klasse": 330,
    "Achtste Klasse": 330,
    Hoofdtoernooi: 0,
  },
  roundsPerClass: {},
  correctieMultiplier: 1.5,
  correctieSubtract: 1800,
  minCost: 1,
  maxCost: 200,
};

/**
 * Get megaschaak configuration for a tournament, with defaults
 */
const getMegaschaakConfig = async (
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

/**
 * Get the active megaschaak tournament (there should only be one)
 */
export const getActiveMegaschaakTournament = async () => {
  try {
    // Find any active tournament with megaschaak enabled
    const tournament = await prisma.tournament.findFirst({
      where: {
        megaschaak_enabled: true,
        finished: false,
      },
      include: {
        participations: {
          include: {
            user: {
              select: {
                user_id: true,
                voornaam: true,
                achternaam: true,
                schaakrating_elo: true,
                is_youth: true,
                avatar_url: true,
              },
            },
          },
        },
      },
    });

    return tournament;
  } catch (error) {
    throw handleDBError(error);
  }
};

/**
 * Get all available players for megaschaak from the active tournament
 * If tournament has multiple classes (same naam), combines all participants
 */
export const getAvailablePlayers = async () => {
  try {
    // First, find the active megaschaak tournament
    const activeTournament = await getActiveMegaschaakTournament();

    if (!activeTournament) {
      // No active megaschaak tournament, return empty array
      return [];
    }

    // Find all tournaments with the same name (different classes)
    const allClassesTournaments = await prisma.tournament.findMany({
      where: {
        naam: activeTournament.naam,
        finished: false,
      },
      include: {
        participations: {
          include: {
            user: {
              select: {
                user_id: true,
                voornaam: true,
                achternaam: true,
                schaakrating_elo: true,
                is_youth: true,
                avatar_url: true,
              },
            },
          },
        },
      },
      orderBy: {
        class_name: "asc",
      },
    });

    // Collect participants with their class information
    const participantsMap = new Map();

    for (const tournament of allClassesTournaments) {
      for (const participation of tournament.participations) {
        if (!participantsMap.has(participation.user.user_id)) {
          participantsMap.set(participation.user.user_id, {
            ...participation.user,
            class_name: tournament.class_name || "Hoofdtoernooi",
          });
        }
      }
    }

    // Convert to array and add costs
    const playersWithCosts = [];
    for (const user of participantsMap.values()) {
      if (
        isExcludedFromMegaschaak(user.voornaam || "", user.achternaam || "")
      ) {
        continue; // Skip: buiten competitie / uitgesloten van megaschaak
      }

      const cost = await calculatePlayerCost(
        user.user_id,
        user.class_name,
        allClassesTournaments.map((t) => t.tournament_id),
      );
      playersWithCosts.push({
        ...user,
        cost,
      });
    }

    const players = playersWithCosts.sort((a, b) => {
      // First sort by class_name
      if (a.class_name !== b.class_name) {
        return a.class_name.localeCompare(b.class_name);
      }
      // Then by rating (descending)
      return b.schaakrating_elo - a.schaakrating_elo;
    });

    return players;
  } catch (error) {
    throw handleDBError(error);
  }
};

/**
 * Get all teams of a user for a specific tournament
 */
export const getUserTeams = async (userId: number, tournamentId: number) => {
  try {
    const teams = await prisma.megaschaakTeam.findMany({
      where: {
        user_id: userId,
        tournament_id: tournamentId,
      },
      include: {
        players: {
          include: {
            player: {
              select: {
                user_id: true,
                voornaam: true,
                achternaam: true,
                schaakrating_elo: true,
                is_youth: true,
                avatar_url: true,
              },
            },
          },
        },
        reserve_player: {
          select: {
            user_id: true,
            voornaam: true,
            achternaam: true,
            schaakrating_elo: true,
            is_youth: true,
            avatar_url: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return teams;
  } catch (error) {
    throw handleDBError(error);
  }
};

/**
 * Get a specific team by ID
 */
export const getTeamById = async (teamId: number, userId: number) => {
  try {
    const team = await prisma.megaschaakTeam.findFirst({
      where: {
        team_id: teamId,
        user_id: userId, // Ensure user owns this team
      },
      include: {
        players: {
          include: {
            player: {
              select: {
                user_id: true,
                voornaam: true,
                achternaam: true,
                schaakrating_elo: true,
                is_youth: true,
                avatar_url: true,
              },
            },
          },
        },
        reserve_player: {
          select: {
            user_id: true,
            voornaam: true,
            achternaam: true,
            schaakrating_elo: true,
            is_youth: true,
            avatar_url: true,
          },
        },
      },
    });

    if (!team) {
      throw ServiceError.notFound("Team niet gevonden of je hebt geen toegang");
    }

    return team;
  } catch (error) {
    throw handleDBError(error);
  }
};

/**
 * Create a new megaschaak team (allows multiple teams per user)
 */
export const createTeam = async (
  userId: number,
  tournamentId: number,
  playerIds: number[],
  teamName: string,
  reservePlayerId?: number,
) => {
  try {
    // Validate team size (standard 10, exception 11)
    if (playerIds.length < 10 || playerIds.length > 11) {
      throw ServiceError.validationFailed(
        "Je moet 10 of 11 spelers selecteren",
      );
    }

    // Validate reserve player is required
    if (!reservePlayerId) {
      throw ServiceError.validationFailed(
        "Je moet nog een reservespeler selecteren!",
      );
    }

    // Check if tournament exists and has megaschaak enabled
    const tournament = await prisma.tournament.findUnique({
      where: { tournament_id: tournamentId },
    });

    if (!tournament) {
      throw ServiceError.notFound("Toernooi niet gevonden");
    }

    if (!tournament.megaschaak_enabled) {
      throw ServiceError.validationFailed(
        "Megaschaak is niet ingeschakeld voor dit toernooi",
      );
    }

    // Check if registration deadline has passed
    if (tournament.megaschaak_deadline) {
      const now = new Date();
      if (now > tournament.megaschaak_deadline) {
        throw ServiceError.validationFailed(
          "De inschrijvingsdeadline is verstreken. Je kan geen nieuwe teams meer aanmaken.",
        );
      }
    }

    // Get all tournaments with the same name (all classes)
    const allClassesTournaments = await prisma.tournament.findMany({
      where: { naam: tournament.naam },
    });
    const tournamentIds = allClassesTournaments.map((t) => t.tournament_id);

    // Get all players and calculate total cost
    const players = await prisma.user.findMany({
      where: {
        user_id: { in: playerIds },
      },
      select: {
        user_id: true,
        schaakrating_elo: true,
      },
    });

    // Get class information for each player
    const participations = await prisma.participation.findMany({
      where: {
        user_id: { in: playerIds },
        tournament_id: { in: tournamentIds },
      },
      include: {
        tournament: {
          select: {
            class_name: true,
          },
        },
      },
    });

    const playerClassMap = new Map();
    for (const participation of participations) {
      if (!playerClassMap.has(participation.user_id)) {
        playerClassMap.set(
          participation.user_id,
          participation.tournament.class_name || "Hoofdtoernooi",
        );
      }
    }

    let totalCost = 0;
    for (const player of players) {
      const className = playerClassMap.get(player.user_id) || "Hoofdtoernooi";
      const cost = await calculatePlayerCost(
        player.user_id,
        className,
        tournamentIds,
      );
      totalCost += cost;
    }

    // Validate budget (max 1000 points)
    if (totalCost > 1000) {
      throw ServiceError.validationFailed(
        `Budget overschreden! Totaal: ${totalCost} punten (max 1000)`,
      );
    }

    // Validate reserve player if provided
    let reserveCost = 0;
    if (reservePlayerId) {
      // Get reserve player's class
      const reserveParticipation = await prisma.participation.findFirst({
        where: {
          user_id: reservePlayerId,
          tournament_id: { in: tournamentIds },
        },
        include: {
          tournament: {
            select: {
              class_name: true,
            },
          },
        },
      });

      if (!reserveParticipation) {
        throw ServiceError.validationFailed(
          "Reservespeler niet gevonden in het toernooi",
        );
      }

      const reserveClassName =
        reserveParticipation.tournament.class_name || "Hoofdtoernooi";
      reserveCost = await calculatePlayerCost(
        reservePlayerId,
        reserveClassName,
        tournamentIds,
      );

      if (reserveCost > 100) {
        throw ServiceError.validationFailed(
          `Reservespeler mag maximaal 100 punten kosten (huidige kost: ${reserveCost})`,
        );
      }
    }

    // Create new team (multiple teams per user allowed)
    const team = await prisma.megaschaakTeam.create({
      data: {
        user_id: userId,
        tournament_id: tournamentId,
        team_name: teamName || "Mijn Team",
        reserve_player_id: reservePlayerId || null,
        reserve_cost: reserveCost || null,
        players: {
          create: await Promise.all(
            players.map(async (player) => {
              const className =
                playerClassMap.get(player.user_id) || "Hoofdtoernooi";
              const cost = await calculatePlayerCost(
                player.user_id,
                className,
                tournamentIds,
              );
              return {
                player_id: player.user_id,
                cost,
              };
            }),
          ),
        },
      },
      include: {
        players: {
          include: {
            player: {
              select: {
                user_id: true,
                voornaam: true,
                achternaam: true,
                schaakrating_elo: true,
                is_youth: true,
                avatar_url: true,
              },
            },
          },
        },
        reserve_player: {
          select: {
            user_id: true,
            voornaam: true,
            achternaam: true,
            schaakrating_elo: true,
            is_youth: true,
            avatar_url: true,
          },
        },
      },
    });

    return team;
  } catch (error) {
    throw handleDBError(error);
  }
};

/**
 * Create a megaschaak team for a user (admin only, bypasses deadline check)
 */
export const adminCreateTeam = async (
  targetUserId: number,
  tournamentId: number,
  playerIds: number[],
  teamName: string,
  reservePlayerId?: number,
) => {
  try {
    // Validate team size (standard 10, exception 11)
    if (playerIds.length < 10 || playerIds.length > 11) {
      throw ServiceError.validationFailed(
        "Je moet 10 of 11 spelers selecteren",
      );
    }

    // Validate reserve player is required
    if (!reservePlayerId) {
      throw ServiceError.validationFailed(
        "Je moet nog een reservespeler selecteren!",
      );
    }

    // Check if tournament exists and has megaschaak enabled
    const tournament = await prisma.tournament.findUnique({
      where: { tournament_id: tournamentId },
    });

    if (!tournament) {
      throw ServiceError.notFound("Toernooi niet gevonden");
    }

    if (!tournament.megaschaak_enabled) {
      throw ServiceError.validationFailed(
        "Megaschaak is niet ingeschakeld voor dit toernooi",
      );
    }

    // Admin bypass: Skip deadline check

    // Get all tournaments with the same name (all classes)
    const allClassesTournaments = await prisma.tournament.findMany({
      where: { naam: tournament.naam },
    });
    const tournamentIds = allClassesTournaments.map((t) => t.tournament_id);

    // Get all players and calculate total cost
    const players = await prisma.user.findMany({
      where: {
        user_id: { in: playerIds },
      },
      select: {
        user_id: true,
        schaakrating_elo: true,
      },
    });

    // Get class information for each player
    const participations = await prisma.participation.findMany({
      where: {
        user_id: { in: playerIds },
        tournament_id: { in: tournamentIds },
      },
      include: {
        tournament: {
          select: {
            class_name: true,
          },
        },
      },
    });

    const playerClassMap = new Map();
    for (const participation of participations) {
      if (!playerClassMap.has(participation.user_id)) {
        playerClassMap.set(
          participation.user_id,
          participation.tournament.class_name || "Hoofdtoernooi",
        );
      }
    }

    let totalCost = 0;
    for (const player of players) {
      const className = playerClassMap.get(player.user_id) || "Hoofdtoernooi";
      const cost = await calculatePlayerCost(
        player.user_id,
        className,
        tournamentIds,
      );
      totalCost += cost;
    }

    // Validate budget (max 1000 points)
    if (totalCost > 1000) {
      throw ServiceError.validationFailed(
        `Budget overschreden! Totaal: ${totalCost} punten (max 1000)`,
      );
    }

    // Validate reserve player if provided
    let reserveCost = 0;
    if (reservePlayerId) {
      // Get reserve player's class
      const reserveParticipation = await prisma.participation.findFirst({
        where: {
          user_id: reservePlayerId,
          tournament_id: { in: tournamentIds },
        },
        include: {
          tournament: {
            select: {
              class_name: true,
            },
          },
        },
      });

      if (!reserveParticipation) {
        throw ServiceError.validationFailed(
          "Reservespeler niet gevonden in het toernooi",
        );
      }

      const reserveClassName =
        reserveParticipation.tournament.class_name || "Hoofdtoernooi";
      reserveCost = await calculatePlayerCost(
        reservePlayerId,
        reserveClassName,
        tournamentIds,
      );

      if (reserveCost > 100) {
        throw ServiceError.validationFailed(
          `Reservespeler mag maximaal 100 punten kosten (huidige kost: ${reserveCost})`,
        );
      }
    }

    // Create new team (multiple teams per user allowed)
    const team = await prisma.megaschaakTeam.create({
      data: {
        user_id: targetUserId,
        tournament_id: tournamentId,
        team_name: teamName || "Mijn Team",
        reserve_player_id: reservePlayerId || null,
        reserve_cost: reserveCost || null,
        players: {
          create: await Promise.all(
            players.map(async (player) => {
              const className =
                playerClassMap.get(player.user_id) || "Hoofdtoernooi";
              const cost = await calculatePlayerCost(
                player.user_id,
                className,
                tournamentIds,
              );
              return {
                player_id: player.user_id,
                cost,
              };
            }),
          ),
        },
      },
      include: {
        players: {
          include: {
            player: {
              select: {
                user_id: true,
                voornaam: true,
                achternaam: true,
                schaakrating_elo: true,
                is_youth: true,
                avatar_url: true,
              },
            },
          },
        },
        reserve_player: {
          select: {
            user_id: true,
            voornaam: true,
            achternaam: true,
            schaakrating_elo: true,
            is_youth: true,
            avatar_url: true,
          },
        },
      },
    });

    return team;
  } catch (error) {
    throw handleDBError(error);
  }
};

/**
 * Update an existing megaschaak team
 */
export const updateTeam = async (
  teamId: number,
  userId: number,
  playerIds: number[],
  teamName?: string,
  reservePlayerId?: number | null,
) => {
  try {
    // First verify the team exists and belongs to the user
    const existingTeam = await prisma.megaschaakTeam.findFirst({
      where: {
        team_id: teamId,
        user_id: userId,
      },
    });

    if (!existingTeam) {
      throw ServiceError.notFound("Team niet gevonden of je hebt geen toegang");
    }

    // Validate team size (standard 10, exception 11)
    if (playerIds.length < 10 || playerIds.length > 11) {
      throw ServiceError.validationFailed(
        "Je moet 10 of 11 spelers selecteren",
      );
    }

    // Validate reserve player is required
    if (!reservePlayerId) {
      throw ServiceError.validationFailed(
        "Je moet nog een reservespeler selecteren!",
      );
    }

    // Check if tournament deadline has passed
    const tournament = await prisma.tournament.findUnique({
      where: { tournament_id: existingTeam.tournament_id },
    });

    if (!tournament) {
      throw ServiceError.notFound("Toernooi niet gevonden");
    }

    if (tournament.megaschaak_deadline) {
      const now = new Date();
      if (now > tournament.megaschaak_deadline) {
        throw ServiceError.validationFailed(
          "De inschrijvingsdeadline is verstreken. Je kan je team niet meer wijzigen.",
        );
      }
    }

    // Get all tournaments with the same name (all classes)
    const allClassesTournaments = await prisma.tournament.findMany({
      where: { naam: tournament.naam },
    });
    const tournamentIds = allClassesTournaments.map((t) => t.tournament_id);

    // Get all players and calculate total cost
    const players = await prisma.user.findMany({
      where: {
        user_id: { in: playerIds },
      },
      select: {
        user_id: true,
        schaakrating_elo: true,
      },
    });

    // Get class information for each player
    const participations = await prisma.participation.findMany({
      where: {
        user_id: { in: playerIds },
        tournament_id: { in: tournamentIds },
      },
      include: {
        tournament: {
          select: {
            class_name: true,
          },
        },
      },
    });

    const playerClassMap = new Map();
    for (const participation of participations) {
      if (!playerClassMap.has(participation.user_id)) {
        playerClassMap.set(
          participation.user_id,
          participation.tournament.class_name || "Hoofdtoernooi",
        );
      }
    }

    let totalCost = 0;
    for (const player of players) {
      const className = playerClassMap.get(player.user_id) || "Hoofdtoernooi";
      const cost = await calculatePlayerCost(
        player.user_id,
        className,
        tournamentIds,
      );
      totalCost += cost;
    }

    // Validate budget (max 1000 points)
    if (totalCost > 1000) {
      throw ServiceError.validationFailed(
        `Budget overschreden! Totaal: ${totalCost} punten (max 1000)`,
      );
    }

    // Validate reserve player if provided
    let reserveCost: number | null = null;
    if (reservePlayerId) {
      // Get reserve player's class
      const reserveParticipation = await prisma.participation.findFirst({
        where: {
          user_id: reservePlayerId,
          tournament_id: { in: tournamentIds },
        },
        include: {
          tournament: {
            select: {
              class_name: true,
            },
          },
        },
      });

      if (!reserveParticipation) {
        throw ServiceError.validationFailed(
          "Reservespeler niet gevonden in het toernooi",
        );
      }

      const reserveClassName =
        reserveParticipation.tournament.class_name || "Hoofdtoernooi";
      reserveCost = await calculatePlayerCost(
        reservePlayerId,
        reserveClassName,
        tournamentIds,
      );

      if (reserveCost > 100) {
        throw ServiceError.validationFailed(
          `Reservespeler mag maximaal 100 punten kosten (huidige kost: ${reserveCost})`,
        );
      }
    }

    // Update team
    await prisma.megaschaakTeamPlayer.deleteMany({
      where: { team_id: teamId },
    });

    const team = await prisma.megaschaakTeam.update({
      where: { team_id: teamId },
      data: {
        team_name: teamName || existingTeam.team_name,
        reserve_player_id:
          reservePlayerId !== undefined
            ? reservePlayerId
            : existingTeam.reserve_player_id,
        reserve_cost:
          reservePlayerId !== undefined
            ? reserveCost
            : existingTeam.reserve_cost,
        players: {
          create: await Promise.all(
            players.map(async (player) => {
              const className =
                playerClassMap.get(player.user_id) || "Hoofdtoernooi";
              const cost = await calculatePlayerCost(
                player.user_id,
                className,
                tournamentIds,
              );
              return {
                player_id: player.user_id,
                cost,
              };
            }),
          ),
        },
      },
      include: {
        players: {
          include: {
            player: {
              select: {
                user_id: true,
                voornaam: true,
                achternaam: true,
                schaakrating_elo: true,
                is_youth: true,
                avatar_url: true,
              },
            },
          },
        },
        reserve_player: {
          select: {
            user_id: true,
            voornaam: true,
            achternaam: true,
            schaakrating_elo: true,
            is_youth: true,
            avatar_url: true,
          },
        },
      },
    });

    return team;
  } catch (error) {
    throw handleDBError(error);
  }
};

/**
 * Delete a team
 */
export const deleteTeam = async (teamId: number, userId: number) => {
  try {
    // Verify the team exists and belongs to the user
    const team = await prisma.megaschaakTeam.findFirst({
      where: {
        team_id: teamId,
        user_id: userId,
      },
      include: {
        tournament: true,
      },
    });

    if (!team) {
      throw ServiceError.notFound("Team niet gevonden of je hebt geen toegang");
    }

    // Check if registration deadline has passed
    if (team.tournament.megaschaak_deadline) {
      const now = new Date();
      if (now > team.tournament.megaschaak_deadline) {
        throw ServiceError.validationFailed(
          "De inschrijvingsdeadline is verstreken. Je kan je team niet meer verwijderen.",
        );
      }
    }

    await prisma.megaschaakTeam.delete({
      where: { team_id: teamId },
    });
  } catch (error) {
    throw handleDBError(error);
  }
};

/**
 * Enable or disable megaschaak for a tournament
 */
export const toggleMegaschaak = async (
  tournamentId: number,
  enabled: boolean,
) => {
  try {
    const tournament = await prisma.tournament.update({
      where: { tournament_id: tournamentId },
      data: { megaschaak_enabled: enabled },
    });

    return tournament;
  } catch (error) {
    throw handleDBError(error);
  }
};

/**
 * Set the registration deadline for megaschaak
 */
export const setMegaschaakDeadline = async (
  tournamentId: number,
  deadline: Date | null,
) => {
  try {
    const tournament = await prisma.tournament.update({
      where: { tournament_id: tournamentId },
      data: { megaschaak_deadline: deadline },
    });

    return tournament;
  } catch (error) {
    throw handleDBError(error);
  }
};

/**
 * Calculate score for a player in a specific game
 */
const calculateGameScore = (game: any, playerId: number): number => {
  // Player not in this game
  if (game.speler1_id !== playerId && game.speler2_id !== playerId) {
    return 0;
  }

  // Forfait / import: winnaar_id staat er, maar result kan leeg of "uitgesteld" zijn — wel vóór result-parsing
  if (game.winnaar_id === playerId) {
    return 1;
  }
  if (
    game.winnaar_id != null &&
    game.speler2_id != null &&
    game.winnaar_id !== playerId
  ) {
    return 0;
  }

  const rawResult = String(game.result ?? "").trim();
  if (
    !rawResult ||
    rawResult === "not_played" ||
    rawResult === "..." ||
    rawResult === "uitgesteld"
  ) {
    return 0;
  }

  // Spaties weg voor 1-0R / 0-1R / 1-0 FF e.d.
  const resFlat = rawResult.replace(/\s+/g, "");

  // Zelfde logica als toernooi-UI: 1-0R, 1-0FF, 1-0, …
  if (resFlat.startsWith("1-0") && game.speler1_id === playerId) {
    return 1;
  }
  if (resFlat.startsWith("0-1") && game.speler2_id === playerId) {
    return 1;
  }

  // Check for draw (½-½, 1/2-1/2 of Sevilla "-")
  if (
    rawResult === "½-½" ||
    rawResult === "1/2-1/2" ||
    rawResult === "-" ||
    resFlat === "1/2-1/2"
  ) {
    return 0.5;
  }

  // Player lost
  return 0;
};

/** Whether a game counts as "played" (for games-played count); BYE en no-result tellen niet mee. Forfaits tellen wel mee. */
const isPlayedGame = (
  result: string | null,
  speler2_id: number | null,
  winnaar_id?: number | null,
): boolean => {
  if (speler2_id === null) return false;
  if (winnaar_id != null) return true;
  const r = typeof result === "string" ? result.trim() : result;
  if (!r || r === "not_played" || r === "..." || r === "uitgesteld")
    return false;
  if (typeof r === "string" && r.startsWith("ABS-")) return false;
  return true;
};

function pairKeyMegaschaak(p1: number, p2: number): string {
  return p1 < p2 ? `${p1}-${p2}` : `${p2}-${p1}`;
}

function getPlannedMegaschaakRounds(
  allClassesTournaments: Array<{
    rondes?: number | null;
    rounds?: Array<{ ronde_nummer: number }>;
  }>,
): number[] {
  const maxPlannedRounds = allClassesTournaments.reduce((max, t) => {
    const n = t.rondes;
    if (typeof n === "number" && n > max) return n;
    return max;
  }, 0);

  const roundsSet = new Set<number>();
  if (maxPlannedRounds > 0) {
    for (let i = 1; i <= maxPlannedRounds; i++) {
      roundsSet.add(i);
    }
  } else {
    for (const t of allClassesTournaments) {
      for (const r of t.rounds ?? []) {
        if (r.ronde_nummer > 0) {
          roundsSet.add(r.ronde_nummer);
        }
      }
    }
  }

  return [...roundsSet].sort((a, b) => a - b);
}

/** Inhaalpartijen op reguliere game_id — gedeeld door collect + team-detail. */
async function buildMakeupByOriginalIdMap(
  allClassesTournaments: Array<{
    tournament_id: number;
    rounds: Array<{ type: string; ronde_nummer: number; games: any[] }>;
  }>,
): Promise<Map<number, any>> {
  const regularGameIds: number[] = [];
  for (const t of allClassesTournaments) {
    for (const r of t.rounds) {
      if (r.type !== RoundType.REGULAR && r.type !== "REGULAR") continue;
      for (const g of r.games) {
        if (g.speler2_id != null && g.game_id != null) {
          regularGameIds.push(g.game_id);
        }
      }
    }
  }

  const makeupByOriginalId = new Map<number, any>();
  if (regularGameIds.length === 0) return makeupByOriginalId;

  const makeups = await prisma.game.findMany({
    where: {
      original_game_id: { in: regularGameIds },
      round: { type: RoundType.MAKEUP },
    },
    include: {
      speler1: true,
      speler2: true,
      winnaar: true,
    },
    orderBy: { game_id: "desc" },
  });
  for (const m of makeups) {
    const oid = m.original_game_id;
    if (oid == null) continue;
    if (!makeupByOriginalId.has(oid)) makeupByOriginalId.set(oid, m);
  }
  return makeupByOriginalId;
}

/**
 * Team-detail: partij per ronde rechtstreeks uit REGULAR-ronde (geen globale dedup).
 */
function resolveEffectiveGameForPlayerInRegularRound(
  tournament: {
    rounds?: Array<{ ronde_nummer: number; games?: any[] }>;
  },
  rondeNummer: number,
  playerId: number,
  makeupByOriginalId: Map<number, any>,
): any | null {
  const round = tournament.rounds?.find((r) => r.ronde_nummer === rondeNummer);
  if (!round?.games?.length) return null;
  const withPlayer = round.games.filter(
    (g) => g.speler1_id === playerId || g.speler2_id === playerId,
  );
  if (withPlayer.length === 0) return null;
  const raw = [...withPlayer].sort((a, b) => b.game_id - a.game_id)[0];
  return resolveRegularGameForMegaschaak(raw, makeupByOriginalId);
}

/**
 * Aantal rondes met een echte tegenstander — zelfde resolutie als getTeamDetailedScores / UI-tabel.
 * Alleen `allGames` + isPlayedGame kan te hoog uitkomen (extra rijen buiten de per-ronde bron).
 */
function countMegaschaakGamesPlayedFromRoundResolution(
  playerId: number,
  teamTournamentId: number,
  playerCompetitionTournamentId: Map<number, number>,
  allClassesTournaments: Array<{
    tournament_id: number;
    rondes?: number | null;
    rounds?: Array<{ ronde_nummer: number; games?: any[] }>;
  }>,
  makeupByOriginalId: Map<number, any>,
  gamesByRound: Map<number, any[]>,
  roundsSorted: number[],
  requireResult: boolean = false,
): number {
  const playerTid =
    playerCompetitionTournamentId.get(playerId) ?? teamTournamentId;
  let count = 0;
  for (const rondeNummer of roundsSorted) {
    const playerTournament = allClassesTournaments.find(
      (t) => t.tournament_id === playerTid,
    );
    let effectiveGame: any | null = null;
    if (playerTournament) {
      effectiveGame = resolveEffectiveGameForPlayerInRegularRound(
        playerTournament,
        rondeNummer,
        playerId,
        makeupByOriginalId,
      );
    }
    if (!effectiveGame) {
      const games = gamesByRound.get(rondeNummer) ?? [];
      effectiveGame =
        games.find(
          (game: any) =>
            game._megaschaak_round?.tournament_id === playerTid &&
            (game.speler1_id === playerId || game.speler2_id === playerId),
        ) ??
        games.find(
          (game: any) =>
            game.speler1_id === playerId || game.speler2_id === playerId,
        ) ??
        null;
    }
    if (
      !effectiveGame ||
      effectiveGame.speler1_id == null ||
      effectiveGame.speler2_id == null
    ) {
      continue;
    }
    if (requireResult && effectiveGame.result == null) {
      continue;
    }
    count += 1;
  }
  return count;
}

function isForfeitLossForPlayer(game: any, playerId: number): boolean {
  if (!game || game.speler2_id == null) return false;
  if (game.speler1_id !== playerId && game.speler2_id !== playerId)
    return false;

  const raw = String(game.result ?? "").trim();
  const flat = raw.replace(/\s+/g, "").toUpperCase();
  const hasForfeitMarker = flat.endsWith("R");
  if (!hasForfeitMarker) return false;

  const playerIsSpeler1 = game.speler1_id === playerId;
  if (flat.startsWith("1-0")) return !playerIsSpeler1;
  if (flat.startsWith("0-1")) return playerIsSpeler1;
  return false;
}

function getRawRoundGameForPlayer(
  playerId: number,
  playerTid: number,
  rondeNummer: number,
  allClassesTournaments: Array<{
    tournament_id: number;
    rounds?: Array<{ ronde_nummer: number; games?: any[] }>;
  }>,
): any | null {
  const playerTournament = allClassesTournaments.find(
    (t) => t.tournament_id === playerTid,
  );
  if (!playerTournament) return null;
  const round = playerTournament.rounds?.find(
    (r) => r.ronde_nummer === rondeNummer,
  );
  if (!round?.games?.length) return null;
  return (
    [...round.games]
      .filter((g) => g.speler1_id === playerId || g.speler2_id === playerId)
      .sort((a, b) => b.game_id - a.game_id)[0] ?? null
  );
}

function isNamedPlayer(
  voornaam: string | null | undefined,
  achternaam: string | null | undefined,
  expectedVoornaam: string,
  expectedAchternaam: string,
): boolean {
  const v = (voornaam || "").trim().toLowerCase();
  const a = (achternaam || "").trim().toLowerCase();
  return (
    v === expectedVoornaam.toLowerCase() &&
    a === expectedAchternaam.toLowerCase()
  );
}

function getRoundScoreFromRoundResolution(
  playerId: number,
  teamTournamentId: number,
  rondeNummer: number,
  playerCompetitionTournamentId: Map<number, number>,
  allClassesTournaments: Array<{
    tournament_id: number;
    rounds?: Array<{ ronde_nummer: number; games?: any[] }>;
  }>,
  makeupByOriginalId: Map<number, any>,
  gamesByRound: Map<number, any[]>,
): number | null {
  const playerTid =
    playerCompetitionTournamentId.get(playerId) ?? teamTournamentId;
  const playerTournament = allClassesTournaments.find(
    (t) => t.tournament_id === playerTid,
  );

  let effectiveGame: any | null = null;
  if (playerTournament) {
    effectiveGame = resolveEffectiveGameForPlayerInRegularRound(
      playerTournament,
      rondeNummer,
      playerId,
      makeupByOriginalId,
    );
  }

  if (!effectiveGame) {
    const games = gamesByRound.get(rondeNummer) ?? [];
    effectiveGame =
      games.find(
        (game: any) =>
          game._megaschaak_round?.tournament_id === playerTid &&
          (game.speler1_id === playerId || game.speler2_id === playerId),
      ) ??
      games.find(
        (game: any) =>
          game.speler1_id === playerId || game.speler2_id === playerId,
      ) ??
      null;
  }

  if (!effectiveGame || effectiveGame.speler2_id === null) {
    return null;
  }
  return calculateGameScore(effectiveGame, playerId);
}

function getJesseReserveReplacementIds(team: {
  reserve_player_id?: number | null;
  players?: Array<{
    player_id: number;
    player?: { voornaam?: string | null; achternaam?: string | null };
  }>;
}): { forfaitPlayerId: number; reservePlayerId: number } | null {
  const reservePlayerId = team.reserve_player_id ?? null;
  if (!reservePlayerId || !team.players?.length) return null;

  const hasReserveAsTeamPlayer = team.players.some(
    (tp) => tp.player_id === reservePlayerId,
  );
  if (!hasReserveAsTeamPlayer) return null;

  const forfaitPlayer = team.players.find((tp) =>
    isNamedPlayer(
      tp.player?.voornaam,
      tp.player?.achternaam,
      "Jesse",
      "Vaerendonck",
    ),
  );
  if (!forfaitPlayer) return null;

  return {
    forfaitPlayerId: forfaitPlayer.player_id,
    reservePlayerId,
  };
}

/** Som van basisspelerskosten (max 10); reservespeler niet mee — ook niet als die als 11e ploegspeler staat. */
function megaschaakTeamPloegWaardeCost(team: {
  reserve_player_id?: number | null;
  players: Array<{ player_id: number; cost: number }>;
}): number {
  const rid = team.reserve_player_id ?? null;
  return team.players.reduce((sum, tp) => {
    if (rid != null && tp.player_id === rid) return sum;
    return sum + tp.cost;
  }, 0);
}

function getAdjustedReserveScoreAndGamesForJesseReplacement(
  team: {
    tournament_id: number;
    reserve_player_id?: number | null;
    players?: Array<{
      player_id: number;
      player?: { voornaam?: string | null; achternaam?: string | null };
    }>;
  },
  playerCompetitionTournamentId: Map<number, number>,
  allClassesTournaments: Array<{
    tournament_id: number;
    rounds?: Array<{ ronde_nummer: number; games?: any[] }>;
  }>,
  makeupByOriginalId: Map<number, any>,
  gamesByRound: Map<number, any[]>,
  roundsSorted: number[],
): {
  forfaitPlayerId: number;
  reservePlayerId: number;
  adjustedScore: number;
  adjustedGames: number;
  adjustedForfaitGames: number;
} | null {
  const replacement = getJesseReserveReplacementIds(team);
  if (!replacement) return null;

  let adjustedScore = 0;
  let adjustedGames = 0;
  let adjustedForfaitGames = 0;
  for (const rondeNummer of roundsSorted) {
    const forfaitTid =
      playerCompetitionTournamentId.get(replacement.forfaitPlayerId) ??
      team.tournament_id;
    const forfaitRawRoundGame = getRawRoundGameForPlayer(
      replacement.forfaitPlayerId,
      forfaitTid,
      rondeNummer,
      allClassesTournaments,
    );
    const forfaitHasBye = forfaitRawRoundGame?.speler2_id == null;
    const forfaitForfeitLoss = isForfeitLossForPlayer(
      forfaitRawRoundGame,
      replacement.forfaitPlayerId,
    );
    const reserveScore = getRoundScoreFromRoundResolution(
      replacement.reservePlayerId,
      team.tournament_id,
      rondeNummer,
      playerCompetitionTournamentId,
      allClassesTournaments,
      makeupByOriginalId,
      gamesByRound,
    );
    const forfaitScore = getRoundScoreFromRoundResolution(
      replacement.forfaitPlayerId,
      team.tournament_id,
      rondeNummer,
      playerCompetitionTournamentId,
      allClassesTournaments,
      makeupByOriginalId,
      gamesByRound,
    );

    // Alleen forfait-rondes vervangen; BYE nooit vervangen.
    if (!forfaitHasBye && forfaitForfeitLoss && reserveScore !== null) {
      adjustedScore += reserveScore;
      adjustedGames += 1;
    }

    // Forfaitnederlagen van de vervangen speler tellen niet mee als gespeelde partij.
    if (forfaitScore !== null && !forfaitForfeitLoss) {
      adjustedForfaitGames += 1;
    }
  }

  return {
    forfaitPlayerId: replacement.forfaitPlayerId,
    reservePlayerId: replacement.reservePlayerId,
    adjustedScore,
    adjustedGames,
    adjustedForfaitGames,
  };
}

/**
 * Reguliere partij met echte uitslag op de speeldag, of anders de inhaalpartij
 * (zelfde koppel, zelfde geplande ronde; geen MAKEUP-rondes in de UI).
 */
function resolveRegularGameForMegaschaak(
  reg: any,
  makeupByOriginalId: Map<number, any>,
): any | null {
  if (reg.speler2_id == null) return null;
  const m =
    reg.game_id != null ? makeupByOriginalId.get(reg.game_id) : undefined;
  const makeupPlayed = m && isPlayedGame(m.result, m.speler2_id, m.winnaar_id);
  // Geldige uitslag op de reguliere rij telt altijd (ook als uitgestelde_datum nog staat).
  if (isPlayedGame(reg.result, reg.speler2_id, reg.winnaar_id)) {
    return reg;
  }
  if (makeupPlayed) {
    return {
      ...reg,
      result: m!.result,
      winnaar_id: m!.winnaar_id,
      winnaar: m!.winnaar,
    };
  }
  return null;
}

/**
 * Alleen REGULAR-rondes; uitslagen gespeeld op inhaaldag worden via original_game_id
 * op de geplande ronde gezet. Per koppel één rij (nieuwste game_id wint bij dubbel).
 */
async function collectDedupedMegaschaakGames(
  allClassesTournaments: Array<{
    tournament_id: number;
    rounds: Array<{
      type: string;
      ronde_nummer: number;
      games: any[];
    }>;
  }>,
  prebuiltMakeupByOriginalId?: Map<number, any>,
): Promise<any[]> {
  const excludedUserIds = await getMegaschaakExcludedUserIds();

  const makeupByOriginalId =
    prebuiltMakeupByOriginalId ??
    (await buildMakeupByOriginalIdMap(allClassesTournaments));

  type Row = { game: any; tournament_id: number; ronde_nummer: number };
  const rows: Row[] = [];
  for (const t of allClassesTournaments) {
    for (const r of t.rounds) {
      if (r.type !== RoundType.REGULAR && r.type !== "REGULAR") continue;
      for (const g of r.games) {
        const effective = resolveRegularGameForMegaschaak(
          g,
          makeupByOriginalId,
        );
        if (!effective) continue;
        if (gameInvolvesMegaschaakExcludedPlayer(effective, excludedUserIds)) {
          continue;
        }
        rows.push({
          game: effective,
          tournament_id: t.tournament_id,
          ronde_nummer: r.ronde_nummer,
        });
      }
    }
  }

  rows.sort((a, b) => b.game.game_id - a.game.game_id);
  const seen = new Set<string>();
  const out: any[] = [];
  for (const { game, tournament_id, ronde_nummer } of rows) {
    const p1 = game.speler1_id;
    const p2 = game.speler2_id!;
    const key = `${tournament_id}-${ronde_nummer}-${pairKeyMegaschaak(p1, p2)}`;
    if (seen.has(key)) continue;
    if (gameInvolvesMegaschaakExcludedPlayer(game, excludedUserIds)) continue;
    seen.add(key);
    out.push({
      ...game,
      _megaschaak_round: {
        tournament_id,
        ronde_nummer,
        type: RoundType.REGULAR,
      },
    });
  }

  const tournamentIds = [
    ...new Set(allClassesTournaments.map((t) => t.tournament_id)),
  ];
  await appendMegaschaakOrphanMakeupGames(
    out,
    seen,
    tournamentIds,
    excludedUserIds,
  );

  return out;
}

/**
 * Inhaalpartijen die (nog) niet via de reguliere rij binnenkomen — bv. ontbrekende
 * koppeling, of alleen op MAKEUP — alsnog onder het geplande rondenummer (offset 1000).
 */
async function appendMegaschaakOrphanMakeupGames(
  out: any[],
  seen: Set<string>,
  tournamentIds: number[],
  excludedUserIds: Set<number>,
): Promise<void> {
  if (tournamentIds.length === 0) return;

  const makeups = await prisma.game.findMany({
    where: {
      speler2_id: { not: null },
      round: {
        type: RoundType.MAKEUP,
        tournament_id: { in: tournamentIds },
      },
    },
    include: {
      speler1: true,
      speler2: true,
      winnaar: true,
      round: true,
    },
    orderBy: { game_id: "desc" },
  });

  const played = makeups.filter((m) =>
    isPlayedGame(m.result, m.speler2_id, m.winnaar_id),
  );

  const origIds = [
    ...new Set(
      played
        .map((m) => m.original_game_id)
        .filter((id): id is number => id != null),
    ),
  ];
  const originals =
    origIds.length > 0
      ? await prisma.game.findMany({
          where: { game_id: { in: origIds } },
          include: {
            round: { select: { ronde_nummer: true, type: true } },
          },
        })
      : [];
  const origMap = new Map(originals.map((o) => [o.game_id, o]));

  for (const m of played) {
    const tid = m.round.tournament_id;
    const p1 = m.speler1_id;
    const p2 = m.speler2_id!;

    let displayRound: number | null = null;
    if (m.original_game_id != null) {
      const orig = origMap.get(m.original_game_id);
      if (orig?.round?.type === RoundType.REGULAR) {
        displayRound = orig.round.ronde_nummer;
      }
    }
    if (displayRound == null) {
      const rn = m.round.ronde_nummer;
      if (typeof rn === "number" && rn >= 1000) {
        displayRound = rn - 1000;
      }
    }
    if (displayRound == null) continue;

    const key = `${tid}-${displayRound}-${pairKeyMegaschaak(p1, p2)}`;
    if (seen.has(key)) continue;

    if (gameInvolvesMegaschaakExcludedPlayer(m, excludedUserIds)) continue;

    seen.add(key);
    out.push({
      ...m,
      _megaschaak_round: {
        tournament_id: tid,
        ronde_nummer: displayRound,
        type: RoundType.REGULAR,
      },
    });
  }
}

/**
 * Get cross-table data: teams vs players with scores
 */
export const getCrossTableData = async (tournamentId: number) => {
  try {
    // Get the tournament to find all related tournaments (all classes)
    const tournament = await prisma.tournament.findUnique({
      where: { tournament_id: tournamentId },
    });

    if (!tournament) {
      throw ServiceError.notFound("Toernooi niet gevonden");
    }

    // Find all tournaments with the same name (all classes)
    const allClassesTournaments = await prisma.tournament.findMany({
      where: {
        naam: tournament.naam,
        finished: false,
      },
      include: {
        rounds: {
          where: { type: megaschaakRoundTypesFilter },
          include: {
            games: {
              include: {
                speler1: true,
                speler2: true,
                winnaar: true,
              },
            },
          },
          orderBy: {
            ronde_nummer: "asc",
          },
        },
      },
      orderBy: {
        class_name: "asc",
      },
    });

    const makeupByOriginalIdCross = await buildMakeupByOriginalIdMap(
      allClassesTournaments,
    );
    const allGames = await collectDedupedMegaschaakGames(
      allClassesTournaments,
      makeupByOriginalIdCross,
    );
    const gamesByRoundCross = new Map<number, any[]>();
    for (const g of allGames) {
      const rn = g._megaschaak_round?.ronde_nummer ?? 0;
      if (!gamesByRoundCross.has(rn)) gamesByRoundCross.set(rn, []);
      gamesByRoundCross.get(rn)!.push(g);
    }
    const roundsSortedCross = getPlannedMegaschaakRounds(allClassesTournaments);

    // Get all teams for this tournament
    const teams = await prisma.megaschaakTeam.findMany({
      where: { tournament_id: tournamentId },
      include: {
        user: {
          select: {
            user_id: true,
            voornaam: true,
            achternaam: true,
          },
        },
        players: {
          include: {
            player: {
              select: {
                user_id: true,
                voornaam: true,
                achternaam: true,
                schaakrating_elo: true,
              },
            },
          },
        },
      },
      orderBy: {
        team_name: "asc",
      },
    });

    // Get all unique players across all teams with their class
    const playersMap = new Map();

    for (const tournament of allClassesTournaments) {
      const className = tournament.class_name || "Hoofdtoernooi";
      for (const participation of (tournament as any).participations || []) {
        if (!playersMap.has(participation.user_id)) {
          playersMap.set(participation.user_id, {
            user_id: participation.user_id,
            className: className,
          });
        }
      }
    }

    // Get all participations for player details
    const allParticipations = await prisma.participation.findMany({
      where: {
        tournament_id: {
          in: allClassesTournaments.map((t) => t.tournament_id),
        },
      },
      include: {
        user: {
          select: {
            user_id: true,
            voornaam: true,
            achternaam: true,
            schaakrating_elo: true,
          },
        },
        tournament: {
          select: {
            class_name: true,
          },
        },
      },
    });

    // Build a map of player costs from teams (if player is in a team, use that cost)
    const playerCostMap = new Map<number, number>();
    for (const team of teams) {
      for (const teamPlayer of team.players) {
        if (!playerCostMap.has(teamPlayer.player_id)) {
          playerCostMap.set(teamPlayer.player_id, teamPlayer.cost);
        }
      }
    }

    // Build players list with class info, tournament score, and cost (exclude Lode e.a. uit megaschaak)
    const participationsForMegaschaak = allParticipations.filter(
      (p) => !isExcludedFromMegaschaak(p.user.voornaam, p.user.achternaam),
    );
    const playersWithClass = await Promise.all(
      participationsForMegaschaak.map(async (p) => {
        // Get cost from team if available, otherwise calculate it
        let cost = playerCostMap.get(p.user.user_id);
        if (cost === undefined) {
          // Calculate cost if not in any team
          const className = p.tournament.class_name || "Hoofdtoernooi";
          cost = await calculatePlayerCost(
            p.user.user_id,
            className,
            allClassesTournaments.map((t) => t.tournament_id),
          );
        }

        return {
          user_id: p.user.user_id,
          voornaam: p.user.voornaam,
          achternaam: p.user.achternaam,
          schaakrating_elo: p.user.schaakrating_elo,
          className: p.tournament.class_name || "Hoofdtoernooi",
          tournamentScore: p.score || 0,
          tie_break: p.tie_break || 0,
          cost: cost,
        };
      }),
    );

    // Remove duplicates (keep first occurrence)
    const uniquePlayers = Array.from(
      new Map(playersWithClass.map((p) => [p.user_id, p])).values(),
    );

    // Custom sort order for class names
    const classOrder = [
      "Hoofdtoernooi",
      "Eerste Klasse",
      "Tweede Klasse",
      "Derde Klasse",
      "Vierde Klasse",
      "Vijfde Klasse",
      "Vierde en Vijfde Klasse",
      "Zesde Klasse",
      "Zevende Klasse",
      "Achtste Klasse",
    ];

    // Sort players by class, then by tournament score (descending), then tie-break
    uniquePlayers.sort((a, b) => {
      if (a.className !== b.className) {
        const aIndex = classOrder.indexOf(a.className);
        const bIndex = classOrder.indexOf(b.className);

        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return a.className.localeCompare(b.className);
      }
      // Within same class, sort by tournament score (descending)
      if (b.tournamentScore !== a.tournamentScore) {
        return b.tournamentScore - a.tournamentScore;
      }
      // If same score, sort by tie-break
      return b.tie_break - a.tie_break;
    });

    const playerCompetitionTournamentIdCross = new Map<number, number>();
    for (const p of uniquePlayers) {
      const rows = participationsForMegaschaak.filter(
        (row) => row.user.user_id === p.user_id,
      );
      const preferred =
        rows.find((row) => row.tournament_id === tournamentId) ?? rows[0];
      if (preferred) {
        playerCompetitionTournamentIdCross.set(
          p.user_id,
          preferred.tournament_id,
        );
      }
    }

    // Add gamesPlayed per player (for crosstable display)
    const uniquePlayersWithGames = uniquePlayers.map((player) => ({
      ...player,
      gamesPlayed: countMegaschaakGamesPlayedFromRoundResolution(
        player.user_id,
        tournamentId,
        playerCompetitionTournamentIdCross,
        allClassesTournaments,
        makeupByOriginalIdCross,
        gamesByRoundCross,
        roundsSortedCross,
      ),
    }));

    // Calculate scores for each team-player combination
    const crossTable = teams.map((team) => {
      const replacementAdjustments =
        getAdjustedReserveScoreAndGamesForJesseReplacement(
          team,
          playerCompetitionTournamentIdCross,
          allClassesTournaments,
          makeupByOriginalIdCross,
          gamesByRoundCross,
          roundsSortedCross,
        );
      const playerScores = uniquePlayersWithGames.map((player) => {
        // Check if this player is in the team
        const isInTeam = team.players.some(
          (tp) => tp.player_id === player.user_id,
        );

        if (!isInTeam) {
          return { player_id: player.user_id, score: null, inTeam: false };
        }

        // Officiële stand (Sevilla / participation.score) — zelfde als toernooipagina; niet herberekenen uit
        // gededupliceerde partijen (forfaits, import-randen, enz. wijken daar soms van af).
        const score =
          replacementAdjustments &&
          player.user_id === replacementAdjustments.reservePlayerId
            ? replacementAdjustments.adjustedScore
            : player.tournamentScore;

        return { player_id: player.user_id, score, inTeam: true };
      });

      const totalScore = playerScores.reduce(
        (sum, ps) => sum + (ps.score || 0),
        0,
      );

      // Som van gespeelde partijen per ploeglid (zelfde als getTeamStandings)
      const gamesPlayed = team.players.reduce(
        (sum, tp) =>
          sum +
          (replacementAdjustments
            ? tp.player_id === replacementAdjustments.reservePlayerId
              ? replacementAdjustments.adjustedGames
              : tp.player_id === replacementAdjustments.forfaitPlayerId
                ? replacementAdjustments.adjustedForfaitGames
                : countMegaschaakGamesPlayedFromRoundResolution(
                    tp.player_id,
                    tournamentId,
                    playerCompetitionTournamentIdCross,
                    allClassesTournaments,
                    makeupByOriginalIdCross,
                    gamesByRoundCross,
                    roundsSortedCross,
                  )
            : countMegaschaakGamesPlayedFromRoundResolution(
                tp.player_id,
                tournamentId,
                playerCompetitionTournamentIdCross,
                allClassesTournaments,
                makeupByOriginalIdCross,
                gamesByRoundCross,
                roundsSortedCross,
              )),
        0,
      );

      // Totaal ploegwaarde: basisspelers; reserve (ook als 11e rij) telt niet mee
      const totalCost = megaschaakTeamPloegWaardeCost(team);

      return {
        team_id: team.team_id,
        team_name: team.team_name,
        user: team.user,
        playerScores,
        totalScore,
        totalCost,
        gamesPlayed,
      };
    });

    // Sort teams by total score
    crossTable.sort((a, b) => {
      if (Math.abs(b.totalScore - a.totalScore) > 0.001) {
        return b.totalScore - a.totalScore;
      }
      return a.totalCost - b.totalCost;
    });

    return {
      teams: crossTable,
      players: uniquePlayersWithGames,
    };
  } catch (error) {
    throw handleDBError(error);
  }
};

/**
 * Get all teams with calculated scores for a tournament
 */
export const getTeamStandings = async (tournamentId: number) => {
  try {
    // Get the tournament to find all related tournaments (all classes)
    const tournament = await prisma.tournament.findUnique({
      where: { tournament_id: tournamentId },
    });

    if (!tournament) {
      throw ServiceError.notFound("Toernooi niet gevonden");
    }

    // Find all tournaments with the same name (all classes)
    const allClassesTournaments = await prisma.tournament.findMany({
      where: {
        naam: tournament.naam,
        finished: false,
      },
      include: {
        rounds: {
          where: { type: megaschaakRoundTypesFilter },
          include: {
            games: {
              include: {
                speler1: true,
                speler2: true,
                winnaar: true,
              },
            },
          },
          orderBy: {
            ronde_nummer: "asc",
          },
        },
      },
    });

    const makeupByOriginalIdStandings = await buildMakeupByOriginalIdMap(
      allClassesTournaments,
    );
    const allGames = await collectDedupedMegaschaakGames(
      allClassesTournaments,
      makeupByOriginalIdStandings,
    );
    const gamesByRoundStandings = new Map<number, any[]>();
    for (const g of allGames) {
      const rn = g._megaschaak_round?.ronde_nummer ?? 0;
      if (!gamesByRoundStandings.has(rn)) gamesByRoundStandings.set(rn, []);
      gamesByRoundStandings.get(rn)!.push(g);
    }
    const roundsSortedStandings = getPlannedMegaschaakRounds(
      allClassesTournaments,
    );

    // Get all teams for this tournament
    const teams = await prisma.megaschaakTeam.findMany({
      where: { tournament_id: tournamentId },
      include: {
        user: {
          select: {
            user_id: true,
            voornaam: true,
            achternaam: true,
            avatar_url: true,
          },
        },
        players: {
          include: {
            player: {
              select: {
                user_id: true,
                voornaam: true,
                achternaam: true,
                schaakrating_elo: true,
                is_youth: true,
                avatar_url: true,
              },
            },
          },
        },
      },
    });

    const classTournamentIdsForStandings = allClassesTournaments.map(
      (t) => t.tournament_id,
    );
    const teamPlayerIdsForStandings = [
      ...new Set(teams.flatMap((t) => t.players.map((p) => p.player_id))),
    ];
    const participationRowsForStandings =
      teamPlayerIdsForStandings.length > 0
        ? await prisma.participation.findMany({
            where: {
              tournament_id: { in: classTournamentIdsForStandings },
              user_id: { in: teamPlayerIdsForStandings },
            },
            select: { user_id: true, score: true, tournament_id: true },
            orderBy: { tournament_id: "asc" },
          })
        : [];
    const officialScoreByUserIdForStandings = new Map<number, number>();
    for (const row of participationRowsForStandings) {
      if (!officialScoreByUserIdForStandings.has(row.user_id)) {
        officialScoreByUserIdForStandings.set(row.user_id, row.score ?? 0);
      }
    }
    const playerCompetitionTournamentIdStandings = new Map<number, number>();
    for (const pid of teamPlayerIdsForStandings) {
      const rows = participationRowsForStandings.filter(
        (p) => p.user_id === pid,
      );
      const preferred =
        rows.find((p) => p.tournament_id === tournamentId) ?? rows[0];
      if (preferred) {
        playerCompetitionTournamentIdStandings.set(
          pid,
          preferred.tournament_id,
        );
      }
    }
    const megaschaakExcludedUserIds = await getMegaschaakExcludedUserIds();

    // Calculate scores for each team
    const teamsWithScores = teams.map((team) => {
      const replacementAdjustments =
        getAdjustedReserveScoreAndGamesForJesseReplacement(
          team,
          playerCompetitionTournamentIdStandings,
          allClassesTournaments,
          makeupByOriginalIdStandings,
          gamesByRoundStandings,
          roundsSortedStandings,
        );
      let totalScore = 0;

      const playerScores = team.players.map((tp) => {
        if (megaschaakExcludedUserIds.has(tp.player_id)) {
          return {
            ...tp,
            score: 0,
          };
        }

        const playerScore =
          replacementAdjustments &&
          tp.player_id === replacementAdjustments.reservePlayerId
            ? replacementAdjustments.adjustedScore
            : (officialScoreByUserIdForStandings.get(tp.player_id) ?? 0);

        totalScore += playerScore;

        return {
          ...tp,
          score: playerScore,
        };
      });

      // Som van gespeelde partijen per ploeglid (zelfde resolutie als teamdetail-UI).
      // Bij een intern duel (twee ploegleden tegen elkaar) telt die partij voor beide: +2 totaal.
      const gamesPlayed = team.players.reduce(
        (sum, tp) =>
          sum +
          (replacementAdjustments
            ? tp.player_id === replacementAdjustments.reservePlayerId
              ? replacementAdjustments.adjustedGames
              : tp.player_id === replacementAdjustments.forfaitPlayerId
                ? replacementAdjustments.adjustedForfaitGames
                : countMegaschaakGamesPlayedFromRoundResolution(
                    tp.player_id,
                    team.tournament_id,
                    playerCompetitionTournamentIdStandings,
                    allClassesTournaments,
                    makeupByOriginalIdStandings,
                    gamesByRoundStandings,
                    roundsSortedStandings,
                  )
            : countMegaschaakGamesPlayedFromRoundResolution(
                tp.player_id,
                team.tournament_id,
                playerCompetitionTournamentIdStandings,
                allClassesTournaments,
                makeupByOriginalIdStandings,
                gamesByRoundStandings,
                roundsSortedStandings,
              )),
        0,
      );

      const totalCost = megaschaakTeamPloegWaardeCost(team);

      return {
        ...team,
        players: playerScores,
        totalScore,
        totalCost,
        gamesPlayed,
      };
    });

    // Sort teams by total score (descending), then lowest team value (ascending)
    teamsWithScores.sort((a, b) => {
      if (Math.abs(b.totalScore - a.totalScore) > 0.001) {
        return b.totalScore - a.totalScore;
      }
      return a.totalCost - b.totalCost;
    });

    return teamsWithScores;
  } catch (error) {
    throw handleDBError(error);
  }
};

/**
 * Get detailed scores per round for a specific team
 */
export const getTeamDetailedScores = async (teamId: number) => {
  try {
    const team = await prisma.megaschaakTeam.findUnique({
      where: { team_id: teamId },
      include: {
        user: {
          select: {
            user_id: true,
            voornaam: true,
            achternaam: true,
            avatar_url: true,
          },
        },
        players: {
          include: {
            player: {
              select: {
                user_id: true,
                voornaam: true,
                achternaam: true,
                schaakrating_elo: true,
                is_youth: true,
                avatar_url: true,
              },
            },
          },
        },
        tournament: true,
      },
    });

    if (!team) {
      throw ServiceError.notFound("Team niet gevonden");
    }

    // Find all tournaments with the same name (all classes)
    const allClassesTournaments = await prisma.tournament.findMany({
      where: {
        naam: team.tournament.naam,
      },
      include: {
        rounds: {
          where: { type: megaschaakRoundTypesFilter },
          include: {
            games: {
              include: {
                speler1: true,
                speler2: true,
                winnaar: true,
                round: true,
              },
            },
          },
          orderBy: {
            ronde_nummer: "asc",
          },
        },
      },
    });

    const makeupByOriginalId = await buildMakeupByOriginalIdMap(
      allClassesTournaments,
    );
    const dedupedGames = await collectDedupedMegaschaakGames(
      allClassesTournaments,
      makeupByOriginalId,
    );

    const gamesByRound = new Map<number, any[]>();
    for (const g of dedupedGames) {
      const rn = g._megaschaak_round?.ronde_nummer ?? 0;
      if (!gamesByRound.has(rn)) gamesByRound.set(rn, []);
      gamesByRound.get(rn)!.push(g);
    }

    const teamTid = team.tournament_id;
    const classTournamentIds = allClassesTournaments.map(
      (t) => t.tournament_id,
    );

    // Spelers kunnen uit verschillende klassen komen; partijen hangen aan hun echte toernooi.
    const participationsForTeamPlayers = await prisma.participation.findMany({
      where: {
        user_id: { in: team.players.map((p) => p.player_id) },
        tournament_id: { in: classTournamentIds },
      },
      select: {
        user_id: true,
        tournament_id: true,
        score: true,
      },
    });
    const playerCompetitionTournamentId = new Map<number, number>();
    for (const tp of team.players) {
      const rows = participationsForTeamPlayers.filter(
        (p) => p.user_id === tp.player_id,
      );
      const preferred =
        rows.find((p) => p.tournament_id === teamTid) ?? rows[0];
      if (preferred) {
        playerCompetitionTournamentId.set(
          tp.player_id,
          preferred.tournament_id,
        );
      }
    }
    const officialTotalScoreByPlayer = new Map<number, number>();
    for (const tp of team.players) {
      const tid = playerCompetitionTournamentId.get(tp.player_id);
      const row =
        tid != null
          ? participationsForTeamPlayers.find(
              (p) => p.user_id === tp.player_id && p.tournament_id === tid,
            )
          : undefined;
      officialTotalScoreByPlayer.set(tp.player_id, row?.score ?? 0);
    }

    const roundsSorted = getPlannedMegaschaakRounds(allClassesTournaments);
    const replacementIds = getJesseReserveReplacementIds(team);
    const megaschaakExcludedUserIds = await getMegaschaakExcludedUserIds();

    // Calculate scores per player per round
    const playerScoresByRound = team.players.map((tp) => {
      if (megaschaakExcludedUserIds.has(tp.player_id)) {
        const byeRoundScores = roundsSorted.map((rondeNummer) => ({
          ronde_nummer: rondeNummer,
          score: null,
          hasGame: false,
          isForfeitLoss: false,
        }));

        return {
          ...tp,
          roundScores: byeRoundScores,
          totalScore: 0,
        };
      }

      const roundScores = roundsSorted.map((rondeNummer) => {
        const playerTid =
          playerCompetitionTournamentId.get(tp.player_id) ?? teamTid;
        const rawRoundGame = getRawRoundGameForPlayer(
          tp.player_id,
          playerTid,
          rondeNummer,
          allClassesTournaments,
        );
        const isForfeitLoss =
          rawRoundGame != null &&
          isForfeitLossForPlayer(rawRoundGame, tp.player_id);

        if (replacementIds && tp.player_id === replacementIds.forfaitPlayerId) {
          const forfaitPlayerTid =
            playerCompetitionTournamentId.get(replacementIds.forfaitPlayerId) ??
            teamTid;
          const forfaitRawRoundGame = getRawRoundGameForPlayer(
            replacementIds.forfaitPlayerId,
            forfaitPlayerTid,
            rondeNummer,
            allClassesTournaments,
          );
          if (
            forfaitRawRoundGame &&
            isForfeitLossForPlayer(
              forfaitRawRoundGame,
              replacementIds.forfaitPlayerId,
            )
          ) {
            return {
              ronde_nummer: rondeNummer,
              score: null,
              hasGame: false,
              isForfeitLoss: true,
            };
          }
        }

        const score = getRoundScoreFromRoundResolution(
          tp.player_id,
          teamTid,
          rondeNummer,
          playerCompetitionTournamentId,
          allClassesTournaments,
          makeupByOriginalId,
          gamesByRound,
        );
        if (score === null) {
          return {
            ronde_nummer: rondeNummer,
            score: null,
            hasGame: false,
            isForfeitLoss,
          };
        }

        if (replacementIds && tp.player_id === replacementIds.reservePlayerId) {
          const forfaitPlayerTid =
            playerCompetitionTournamentId.get(replacementIds.forfaitPlayerId) ??
            teamTid;
          const forfaitRawRoundGame = getRawRoundGameForPlayer(
            replacementIds.forfaitPlayerId,
            forfaitPlayerTid,
            rondeNummer,
            allClassesTournaments,
          );
          const forfaitHasAnyRoundEntry = forfaitRawRoundGame != null;
          const forfaitHasBye = forfaitRawRoundGame?.speler2_id == null;
          const forfaitForfeitLoss = isForfeitLossForPlayer(
            forfaitRawRoundGame,
            replacementIds.forfaitPlayerId,
          );
          const reserveShouldReplace = !forfaitHasBye && forfaitForfeitLoss;

          if (forfaitHasAnyRoundEntry && !reserveShouldReplace) {
            return {
              ronde_nummer: rondeNummer,
              score: null,
              hasGame: false,
              isForfeitLoss: false,
            };
          }
        }

        return {
          ronde_nummer: rondeNummer,
          score,
          isForfeitLoss,
        };
      });

      const totalScoreFromRounds = roundScores.reduce(
        (sum, rs) => sum + (rs.score ?? 0),
        0,
      );
      const totalScore =
        replacementIds && tp.player_id === replacementIds.reservePlayerId
          ? totalScoreFromRounds
          : (officialTotalScoreByPlayer.get(tp.player_id) ??
            totalScoreFromRounds);

      return {
        ...tp,
        roundScores,
        totalScore,
      };
    });

    return {
      ...team,
      players: playerScoresByRound,
      rounds: roundsSorted,
    };
  } catch (error) {
    throw handleDBError(error);
  }
};

/**
 * Get most popular players (by selection count)
 */
export const getMostPopularPlayers = async (tournamentId: number) => {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { tournament_id: tournamentId },
    });

    if (!tournament) {
      throw ServiceError.notFound("Toernooi niet gevonden");
    }

    // Get all tournaments with the same name (all classes)
    const allClassesTournaments = await prisma.tournament.findMany({
      where: { naam: tournament.naam },
    });

    const tournamentIds = allClassesTournaments.map((t) => t.tournament_id);

    // Get all teams for this tournament
    const teams = await prisma.megaschaakTeam.findMany({
      where: {
        tournament_id: { in: tournamentIds },
      },
      include: {
        players: {
          include: {
            player: {
              select: {
                user_id: true,
                voornaam: true,
                achternaam: true,
                schaakrating_elo: true,
              },
            },
          },
        },
      },
    });

    // Count player selections
    const playerSelectionCount = new Map<
      number,
      {
        player: any;
        cost: number;
        selectionCount: number;
        className: string;
      }
    >();

    for (const team of teams) {
      for (const teamPlayer of team.players) {
        const playerId = teamPlayer.player_id;
        if (!playerSelectionCount.has(playerId)) {
          // Get player's class
          const participation = await prisma.participation.findFirst({
            where: {
              user_id: playerId,
              tournament_id: { in: tournamentIds },
            },
            include: {
              tournament: {
                select: {
                  class_name: true,
                },
              },
            },
          });

          playerSelectionCount.set(playerId, {
            player: teamPlayer.player,
            cost: teamPlayer.cost,
            selectionCount: 1,
            className: participation?.tournament.class_name || "Hoofdtoernooi",
          });
        } else {
          const existing = playerSelectionCount.get(playerId)!;
          existing.selectionCount++;
        }
      }
    }

    // Convert to array and sort by selection count
    const popularPlayers = Array.from(playerSelectionCount.values()).sort(
      (a, b) => b.selectionCount - a.selectionCount,
    );

    return popularPlayers.map((p) => ({
      user_id: p.player.user_id,
      voornaam: p.player.voornaam,
      achternaam: p.player.achternaam,
      schaakrating_elo: p.player.schaakrating_elo,
      cost: p.cost,
      selectionCount: p.selectionCount,
      className: p.className,
    }));
  } catch (error) {
    throw handleDBError(error);
  }
};

/**
 * Get best value players (points per cost ratio)
 */
export const getBestValuePlayers = async (tournamentId: number) => {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { tournament_id: tournamentId },
    });

    if (!tournament) {
      throw ServiceError.notFound("Toernooi niet gevonden");
    }

    // Get all tournaments with the same name (all classes), incl. rondes voor value-ratio
    const allClassesTournaments = await prisma.tournament.findMany({
      where: { naam: tournament.naam },
      include: {
        rounds: {
          where: { type: megaschaakRoundTypesFilter },
          include: {
            games: {
              include: {
                speler1: true,
                speler2: true,
                winnaar: true,
              },
            },
          },
          orderBy: { ronde_nummer: "asc" },
        },
      },
    });

    const tournamentIds = allClassesTournaments.map((t) => t.tournament_id);

    const makeupByOriginalIdValue = await buildMakeupByOriginalIdMap(
      allClassesTournaments,
    );
    const allGamesValue = await collectDedupedMegaschaakGames(
      allClassesTournaments,
      makeupByOriginalIdValue,
    );
    const gamesByRoundValue = new Map<number, any[]>();
    for (const g of allGamesValue) {
      const rn = g._megaschaak_round?.ronde_nummer ?? 0;
      if (!gamesByRoundValue.has(rn)) gamesByRoundValue.set(rn, []);
      gamesByRoundValue.get(rn)!.push(g);
    }
    const roundsSortedValue = getPlannedMegaschaakRounds(allClassesTournaments);

    // Get all teams for this tournament
    const teams = await prisma.megaschaakTeam.findMany({
      where: {
        tournament_id: { in: tournamentIds },
      },
      include: {
        players: {
          include: {
            player: {
              select: {
                user_id: true,
                voornaam: true,
                achternaam: true,
                schaakrating_elo: true,
              },
            },
          },
        },
      },
    });

    // Collect unique players from teams (for cost info)
    const teamPlayerCosts = new Map<number, number>();
    for (const team of teams) {
      for (const teamPlayer of team.players) {
        const playerId = teamPlayer.player_id;
        // Store the cost from the team (use first occurrence if multiple teams)
        if (!teamPlayerCosts.has(playerId)) {
          teamPlayerCosts.set(playerId, teamPlayer.cost);
        }
      }
    }

    // Get all participants from all tournaments (all classes)
    const allParticipations = await prisma.participation.findMany({
      where: {
        tournament_id: { in: tournamentIds },
      },
      include: {
        user: {
          select: {
            user_id: true,
            voornaam: true,
            achternaam: true,
            schaakrating_elo: true,
          },
        },
        tournament: {
          select: {
            class_name: true,
          },
        },
      },
    });
    const playerCompetitionTournamentIdValue = new Map<number, number>();
    const participationPlayerIds = [
      ...new Set(allParticipations.map((p) => p.user.user_id)),
    ];
    for (const pid of participationPlayerIds) {
      const rows = allParticipations.filter((p) => p.user.user_id === pid);
      const preferred =
        rows.find((p) => p.tournament_id === tournamentId) ?? rows[0];
      if (preferred) {
        playerCompetitionTournamentIdValue.set(pid, preferred.tournament_id);
      }
    }

    // Collect unique players (all participants, not just those in teams); exclude Lode e.a. uit megaschaak
    const playerData = new Map<
      number,
      {
        player: any;
        cost: number;
        totalScore: number;
        gamesPlayed: number;
        className: string;
      }
    >();

    const participationsForValue = allParticipations.filter(
      (p) => !isExcludedFromMegaschaak(p.user.voornaam, p.user.achternaam),
    );
    for (const participation of participationsForValue) {
      const playerId = participation.user.user_id;

      if (!playerData.has(playerId)) {
        // Get cost from team if available, otherwise calculate it
        let playerCost = teamPlayerCosts.get(playerId);
        if (!playerCost) {
          // Calculate cost if not in any team
          const className =
            participation.tournament.class_name || "Hoofdtoernooi";
          playerCost = await calculatePlayerCost(
            playerId,
            className,
            tournamentIds,
          );
        }

        playerData.set(playerId, {
          player: participation.user,
          cost: playerCost,
          totalScore: participation.score ?? 0,
          gamesPlayed: 0,
          className: participation.tournament.class_name || "Hoofdtoernooi",
        });
      }
    }

    // Gebruik exact dezelfde gamesPlayed-resolutie als in de andere megaschaak-overzichten.
    for (const [playerId, data] of playerData.entries()) {
      data.gamesPlayed = countMegaschaakGamesPlayedFromRoundResolution(
        playerId,
        tournamentId,
        playerCompetitionTournamentIdValue,
        allClassesTournaments,
        makeupByOriginalIdValue,
        gamesByRoundValue,
        roundsSortedValue,
        true,
      );
    }

    // Get total rounds per class for value ratio calculation
    const config = await getMegaschaakConfig(tournamentIds);
    const roundsPerClassMap: { [key: string]: number } = {};

    // Get rounds from tournaments
    for (const tournament of allClassesTournaments) {
      if (tournament.class_name && tournament.rondes) {
        roundsPerClassMap[tournament.class_name] = tournament.rondes;
      }
    }

    // Use config roundsPerClass if available, otherwise use tournament rondes
    Object.keys(config.roundsPerClass).forEach((className) => {
      if (config.roundsPerClass[className]) {
        roundsPerClassMap[className] = config.roundsPerClass[className];
      }
    });

    // Calculate value ratio based on punten per kost
    const valuePlayers = Array.from(playerData.values())
      .map((p) => {
        // Ratio: behaalde punten per budgetpunt
        const playedGames = p.gamesPlayed;
        const valueRatio = p.cost > 0 ? p.totalScore / p.cost : 0;

        return {
          user_id: p.player.user_id,
          voornaam: p.player.voornaam,
          achternaam: p.player.achternaam,
          schaakrating_elo: p.player.schaakrating_elo,
          cost: p.cost,
          totalScore: p.totalScore,
          gamesPlayed: playedGames,
          valueRatio,
          className: p.className,
        };
      })
      .sort((a, b) => {
        // First sort by valueRatio (descending)
        if (Math.abs(b.valueRatio - a.valueRatio) > 0.001) {
          return b.valueRatio - a.valueRatio;
        }
        // If valueRatio is equal (within 0.001), sort by cost (ascending)
        // Players with lower cost rank higher
        return a.cost - b.cost;
      });

    return valuePlayers;
  } catch (error) {
    throw handleDBError(error);
  }
};

/**
 * Get all teams for a tournament (admin only)
 */
export const getAllTeamsForTournament = async (tournamentId: number) => {
  try {
    const teams = await prisma.megaschaakTeam.findMany({
      where: {
        tournament_id: tournamentId,
      },
      include: {
        user: {
          select: {
            user_id: true,
            voornaam: true,
            achternaam: true,
            email: true,
          },
        },
        players: {
          include: {
            player: {
              select: {
                user_id: true,
                voornaam: true,
                achternaam: true,
                schaakrating_elo: true,
              },
            },
          },
        },
        reserve_player: {
          select: {
            user_id: true,
            voornaam: true,
            achternaam: true,
            schaakrating_elo: true,
          },
        },
      },
      orderBy: [{ created_at: "desc" }],
    });

    return teams;
  } catch (error) {
    throw handleDBError(error);
  }
};

/**
 * Delete a team (admin only - bypasses user ownership check)
 */
export const adminDeleteTeam = async (teamId: number) => {
  try {
    const team = await prisma.megaschaakTeam.findUnique({
      where: { team_id: teamId },
    });

    if (!team) {
      throw ServiceError.notFound("Team niet gevonden");
    }

    await prisma.megaschaakTeam.delete({
      where: { team_id: teamId },
    });
  } catch (error) {
    throw handleDBError(error);
  }
};

/**
 * Get megaschaak configuration for a tournament (admin only)
 */
export const getMegaschaakConfiguration = async (
  tournamentId: number,
): Promise<MegaschaakConfig> => {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { tournament_id: tournamentId },
      select: { megaschaak_config: true },
    });

    if (!tournament) {
      throw ServiceError.notFound("Toernooi niet gevonden");
    }

    return await getMegaschaakConfig([tournamentId]);
  } catch (error) {
    throw handleDBError(error);
  }
};

/**
 * Update megaschaak configuration for a tournament (admin only)
 */
export const updateMegaschaakConfiguration = async (
  tournamentId: number,
  config: Partial<MegaschaakConfig>,
): Promise<MegaschaakConfig> => {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { tournament_id: tournamentId },
    });

    if (!tournament) {
      throw ServiceError.notFound("Toernooi niet gevonden");
    }

    // Get current config and merge with new values
    const currentConfig = await getMegaschaakConfig([tournamentId]);
    const updatedConfig: MegaschaakConfig = {
      classBonusPoints: {
        ...currentConfig.classBonusPoints,
        ...(config.classBonusPoints || {}),
      },
      roundsPerClass: {
        ...currentConfig.roundsPerClass,
        ...(config.roundsPerClass || {}),
      },
      correctieMultiplier:
        config.correctieMultiplier ?? currentConfig.correctieMultiplier,
      correctieSubtract:
        config.correctieSubtract ?? currentConfig.correctieSubtract,
      minCost: config.minCost ?? currentConfig.minCost,
      maxCost: config.maxCost ?? currentConfig.maxCost,
    };

    // Find all tournaments with the same name (all classes should share the same config)
    const allClassesTournaments = await prisma.tournament.findMany({
      where: {
        naam: tournament.naam,
      },
      select: {
        tournament_id: true,
      },
    });

    // Update all tournaments with the same name with the new config
    await prisma.tournament.updateMany({
      where: {
        tournament_id: {
          in: allClassesTournaments.map((t) => t.tournament_id),
        },
      },
      data: {
        megaschaak_config: updatedConfig as any,
      },
    });

    return updatedConfig;
  } catch (error) {
    throw handleDBError(error);
  }
};
