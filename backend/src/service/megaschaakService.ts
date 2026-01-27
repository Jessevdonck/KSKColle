import { prisma } from "./data";
import ServiceError from "../core/serviceError";
import handleDBError from "./handleDBError";

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
function isExcludedFromMegaschaak(voornaam: string, achternaam: string): boolean {
  const v = (voornaam || '').trim().toLowerCase();
  const a = (achternaam || '').trim().toLowerCase();
  if (v === 'piet' && a === 'vermeiren') return true; // bestaande uitsluiting lentecompetitie
  if (v === 'lode' && (a.includes('landeghem') || a.includes('van landeghem'))) return true;
  return false;
}

const DEFAULT_CONFIG: MegaschaakConfig = {
  classBonusPoints: {
    'Eerste Klasse': 0,
    'Tweede Klasse': 110,
    'Derde Klasse': 190,
    'Vierde Klasse': 270,
    'Vijfde Klasse': 330,
    'Vierde en Vijfde Klasse': 330,
    'Zesde Klasse': 330,
    'Zevende Klasse': 330,
    'Achtste Klasse': 330,
    'Hoofdtoernooi': 0
  },
  roundsPerClass: {},
  correctieMultiplier: 1.5,
  correctieSubtract: 1800,
  minCost: 1,
  maxCost: 200
};

/**
 * Get megaschaak configuration for a tournament, with defaults
 */
const getMegaschaakConfig = async (tournamentIds: number[], className?: string): Promise<MegaschaakConfig> => {
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
        class_name: true
      }
    });

    // Build default roundsPerClass from tournament data
    const defaultRoundsPerClass: { [key: string]: number } = {};
    tournaments.forEach(t => {
      if (t.class_name && t.rondes) {
        defaultRoundsPerClass[t.class_name] = t.rondes;
      }
    });

    // If a specific class is requested and we have its tournament, use its rounds
    if (className) {
      const classTournament = tournaments.find(t => t.class_name === className);
      if (classTournament && classTournament.rondes) {
        defaultRoundsPerClass[className] = classTournament.rondes;
      }
    }

    // Find the first tournament with a config (config should be the same for all tournaments with same name)
    const tournamentWithConfig = tournaments.find(t => t.megaschaak_config !== null) || tournaments[0];
    if (tournamentWithConfig?.megaschaak_config) {
      const config = tournamentWithConfig.megaschaak_config as any;
      return {
        classBonusPoints: { ...DEFAULT_CONFIG.classBonusPoints, ...(config.classBonusPoints || {}) },
        roundsPerClass: { ...defaultRoundsPerClass, ...(config.roundsPerClass || {}) },
        correctieMultiplier: config.correctieMultiplier ?? DEFAULT_CONFIG.correctieMultiplier,
        correctieSubtract: config.correctieSubtract ?? DEFAULT_CONFIG.correctieSubtract,
        minCost: config.minCost ?? DEFAULT_CONFIG.minCost,
        maxCost: config.maxCost ?? DEFAULT_CONFIG.maxCost,
        playerCosts: config.playerCosts || undefined // Include playerCosts if present
      };
    }

    // Return config with default rounds from tournaments
    return {
      ...DEFAULT_CONFIG,
      roundsPerClass: defaultRoundsPerClass
    };
  } catch (error) {
    console.error('Error loading megaschaak config:', error);
  }

  return DEFAULT_CONFIG;
};

/**
 * Calculate bonus points based on class using configuration
 */
const getBonusPointsByClass = (className: string, config: MegaschaakConfig): number => {
  return config.classBonusPoints[className] || 0;
};

/**
 * Calculate TPR (Tournament Performance Rating) for a player
 * Based on performance in the latest Herfstcompetitie or Lentecompetitie tournament
 * @param playerId - The player's user ID
 * @param tournamentType - 'herfst' for Herfstcompetitie, 'lente' for Lentecompetitie, or undefined to auto-detect
 */
const calculateTPR = async (playerId: number, tournamentType?: 'herfst' | 'lente'): Promise<number> => {
  try {
    // Get player's current rating as fallback
    const player = await prisma.user.findUnique({
      where: { user_id: playerId },
      select: { schaakrating_elo: true }
    });
    const fallbackRating = player?.schaakrating_elo || 1500;

    // Determine which tournament type to use
    const useHerfst = tournamentType === 'herfst' || tournamentType === undefined;
    const useLente = tournamentType === 'lente' || tournamentType === undefined;

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
        OR: searchTerms.map(term => ({
          naam: { contains: term }
        }))
      },
      include: {
        rounds: {
          include: {
            games: {
              where: {
                OR: [
                  { speler1_id: playerId },
                  { speler2_id: playerId }
                ]
              },
              include: {
                speler1: {
                  select: { schaakrating_elo: true }
                },
                speler2: {
                  select: { schaakrating_elo: true }
                }
              }
            }
          },
          orderBy: {
            ronde_datum: 'desc'
          }
        }
      },
      orderBy: {
        tournament_id: 'desc'
      }
    });

    // Filter tournaments case-insensitively in JavaScript (MySQL limitation)
    const allTournaments = allTournamentsRaw.filter((tournament: any) => {
      const naamLower = tournament.naam.toLowerCase();
      return searchTerms.some((term: string) => naamLower.includes(term.toLowerCase()));
    });

    // Find the tournament with the latest round date
    let latestTournament: typeof allTournaments[0] | null = null;
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
          tournament_id: latestTournament.tournament_id
        }
      },
      select: {
        sevilla_initial_rating: true
      }
    });

    // If player didn't participate in the tournament, TPR = ELO
    if (!participation) {
      return fallbackRating;
    }

    // Use initial rating from tournament if available, otherwise use current rating
    const playerRatingAtTournament = participation.sevilla_initial_rating || fallbackRating;

    // Get all games for this player in the latest tournament
    const allGames = latestTournament.rounds.flatMap(round => round.games);
    
    if (allGames.length === 0) {
      // No games played, return current rating (TPR = ELO)
      return fallbackRating;
    }

    // Get all participations for this tournament to get opponent ratings at tournament start
    const allParticipations = await prisma.participation.findMany({
      where: {
        tournament_id: latestTournament.tournament_id
      },
      select: {
        user_id: true,
        sevilla_initial_rating: true
      }
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
      const opponentRating = initialRatings.get(opponentId) || 
                             (isPlayer1 ? game.speler2?.schaakrating_elo : game.speler1?.schaakrating_elo) || 
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
    console.error('Error calculating TPR:', error);
    // Fallback to current rating
    const player = await prisma.user.findUnique({
      where: { user_id: playerId },
      select: { schaakrating_elo: true }
    });
    return player?.schaakrating_elo || 1500;
  }
};

/**
 * Calculate megaschaak cost using the Excel formulas
 */
export const calculatePlayerCost = async (playerId: number, className: string, tournamentIds: number[]): Promise<number> => {
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
      select: { schaakrating_elo: true }
    });

    if (!player) return 50; // Default fallback

    const rating = player.schaakrating_elo;

    // Determine tournament type from tournamentIds
    let tournamentType: 'herfst' | 'lente' | undefined = undefined;
    if (tournamentIds.length > 0) {
      const tournament = await prisma.tournament.findFirst({
        where: { tournament_id: { in: tournamentIds } },
        select: { naam: true }
      });
      
      if (tournament) {
        const name = tournament.naam.toLowerCase();
        if (name.includes('herfst') || name.includes('herfstcompetitie')) {
          tournamentType = 'herfst';
        } else if (name.includes('lente') || name.includes('lentecompetitie')) {
          tournamentType = 'lente';
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
    const correctie = ptTot * config.correctieMultiplier - config.correctieSubtract;

    // 6. Get number of rounds for this class (from config or tournament default)
    const numberOfRounds = config.roundsPerClass[className] || 10; // Default to 10 if not configured

    // 7. Megaschaak kost = MROUND(Correctie, 10) / aantal_rondes (afgerond naar geheel getal)
    const megaschaakCost = Math.round(correctie / 10) * 10 / numberOfRounds;

    // Round to nearest whole number
    const roundedCost = Math.round(megaschaakCost);

    // Ensure cost is within configured bounds
    return Math.max(config.minCost, Math.min(config.maxCost, roundedCost));
  } catch (error) {
    console.error('Error calculating player cost:', error);
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
        finished: false
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
              }
            }
          }
        }
      }
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
        finished: false
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
              }
            }
          }
        }
      },
      orderBy: {
        class_name: 'asc'
      }
    });

    // Collect participants with their class information
    const participantsMap = new Map();
    
    for (const tournament of allClassesTournaments) {
      for (const participation of tournament.participations) {
        if (!participantsMap.has(participation.user.user_id)) {
          participantsMap.set(participation.user.user_id, {
            ...participation.user,
            class_name: tournament.class_name || 'Hoofdtoernooi'
          });
        }
      }
    }

    // Check if this is a lentecompetitie tournament
    const isLentecompetitie = activeTournament.naam.toLowerCase().includes('lente') || 
                               activeTournament.naam.toLowerCase().includes('lentecompetitie');

    // Convert to array and add costs
    const playersWithCosts = [];
    for (const user of participantsMap.values()) {
      if (isExcludedFromMegaschaak(user.voornaam || '', user.achternaam || '')) {
        continue; // Skip: buiten competitie / uitgesloten van megaschaak
      }
      
      const cost = await calculatePlayerCost(user.user_id, user.class_name, allClassesTournaments.map(t => t.tournament_id));
      playersWithCosts.push({
        ...user,
        cost
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
        tournament_id: tournamentId
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
              }
            }
          }
        },
        reserve_player: {
          select: {
            user_id: true,
            voornaam: true,
            achternaam: true,
            schaakrating_elo: true,
            is_youth: true,
            avatar_url: true,
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
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
        user_id: userId // Ensure user owns this team
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
              }
            }
          }
        },
        reserve_player: {
          select: {
            user_id: true,
            voornaam: true,
            achternaam: true,
            schaakrating_elo: true,
            is_youth: true,
            avatar_url: true,
          }
        }
      }
    });

    if (!team) {
      throw ServiceError.notFound('Team niet gevonden of je hebt geen toegang');
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
  reservePlayerId?: number
) => {
  try {
    // Validate exactly 10 players
    if (playerIds.length !== 10) {
      throw ServiceError.validationFailed('Je moet precies 10 spelers selecteren');
    }

    // Validate reserve player is required
    if (!reservePlayerId) {
      throw ServiceError.validationFailed('Je moet nog een reservespeler selecteren!');
    }

    // Check if tournament exists and has megaschaak enabled
    const tournament = await prisma.tournament.findUnique({
      where: { tournament_id: tournamentId }
    });

    if (!tournament) {
      throw ServiceError.notFound('Toernooi niet gevonden');
    }

    if (!tournament.megaschaak_enabled) {
      throw ServiceError.validationFailed('Megaschaak is niet ingeschakeld voor dit toernooi');
    }

    // Check if registration deadline has passed
    if (tournament.megaschaak_deadline) {
      const now = new Date();
      if (now > tournament.megaschaak_deadline) {
        throw ServiceError.validationFailed('De inschrijvingsdeadline is verstreken. Je kan geen nieuwe teams meer aanmaken.');
      }
    }

    // Get all tournaments with the same name (all classes)
    const allClassesTournaments = await prisma.tournament.findMany({
      where: { naam: tournament.naam }
    });
    const tournamentIds = allClassesTournaments.map(t => t.tournament_id);

    // Get all players and calculate total cost
    const players = await prisma.user.findMany({
      where: {
        user_id: { in: playerIds }
      },
      select: {
        user_id: true,
        schaakrating_elo: true
      }
    });

    // Get class information for each player
    const participations = await prisma.participation.findMany({
      where: {
        user_id: { in: playerIds },
        tournament_id: { in: tournamentIds }
      },
      include: {
        tournament: {
          select: {
            class_name: true
          }
        }
      }
    });

    const playerClassMap = new Map();
    for (const participation of participations) {
      if (!playerClassMap.has(participation.user_id)) {
        playerClassMap.set(participation.user_id, participation.tournament.class_name || 'Hoofdtoernooi');
      }
    }

    let totalCost = 0;
    for (const player of players) {
      const className = playerClassMap.get(player.user_id) || 'Hoofdtoernooi';
      const cost = await calculatePlayerCost(player.user_id, className, tournamentIds);
      totalCost += cost;
    }

    // Validate budget (max 1000 points)
    if (totalCost > 1000) {
      throw ServiceError.validationFailed(`Budget overschreden! Totaal: ${totalCost} punten (max 1000)`);
    }

    // Validate reserve player if provided
    let reserveCost = 0;
    if (reservePlayerId) {
      // Get reserve player's class
      const reserveParticipation = await prisma.participation.findFirst({
        where: {
          user_id: reservePlayerId,
          tournament_id: { in: tournamentIds }
        },
        include: {
          tournament: {
            select: {
              class_name: true
            }
          }
        }
      });

      if (!reserveParticipation) {
        throw ServiceError.validationFailed('Reservespeler niet gevonden in het toernooi');
      }

      const reserveClassName = reserveParticipation.tournament.class_name || 'Hoofdtoernooi';
      reserveCost = await calculatePlayerCost(reservePlayerId, reserveClassName, tournamentIds);

      if (reserveCost > 100) {
        throw ServiceError.validationFailed(`Reservespeler mag maximaal 100 punten kosten (huidige kost: ${reserveCost})`);
      }
    }

    // Create new team (multiple teams per user allowed)
    const team = await prisma.megaschaakTeam.create({
      data: {
        user_id: userId,
        tournament_id: tournamentId,
        team_name: teamName || 'Mijn Team',
        reserve_player_id: reservePlayerId || null,
        reserve_cost: reserveCost || null,
        players: {
          create: await Promise.all(players.map(async player => {
            const className = playerClassMap.get(player.user_id) || 'Hoofdtoernooi';
            const cost = await calculatePlayerCost(player.user_id, className, tournamentIds);
            return {
              player_id: player.user_id,
              cost
            };
          }))
        }
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
              }
            }
          }
        },
        reserve_player: {
          select: {
            user_id: true,
            voornaam: true,
            achternaam: true,
            schaakrating_elo: true,
            is_youth: true,
            avatar_url: true,
          }
        }
      }
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
  reservePlayerId?: number
) => {
  try {
    // Validate exactly 10 players
    if (playerIds.length !== 10) {
      throw ServiceError.validationFailed('Je moet precies 10 spelers selecteren');
    }

    // Validate reserve player is required
    if (!reservePlayerId) {
      throw ServiceError.validationFailed('Je moet nog een reservespeler selecteren!');
    }

    // Check if tournament exists and has megaschaak enabled
    const tournament = await prisma.tournament.findUnique({
      where: { tournament_id: tournamentId }
    });

    if (!tournament) {
      throw ServiceError.notFound('Toernooi niet gevonden');
    }

    if (!tournament.megaschaak_enabled) {
      throw ServiceError.validationFailed('Megaschaak is niet ingeschakeld voor dit toernooi');
    }

    // Admin bypass: Skip deadline check

    // Get all tournaments with the same name (all classes)
    const allClassesTournaments = await prisma.tournament.findMany({
      where: { naam: tournament.naam }
    });
    const tournamentIds = allClassesTournaments.map(t => t.tournament_id);

    // Get all players and calculate total cost
    const players = await prisma.user.findMany({
      where: {
        user_id: { in: playerIds }
      },
      select: {
        user_id: true,
        schaakrating_elo: true
      }
    });

    // Get class information for each player
    const participations = await prisma.participation.findMany({
      where: {
        user_id: { in: playerIds },
        tournament_id: { in: tournamentIds }
      },
      include: {
        tournament: {
          select: {
            class_name: true
          }
        }
      }
    });

    const playerClassMap = new Map();
    for (const participation of participations) {
      if (!playerClassMap.has(participation.user_id)) {
        playerClassMap.set(participation.user_id, participation.tournament.class_name || 'Hoofdtoernooi');
      }
    }

    let totalCost = 0;
    for (const player of players) {
      const className = playerClassMap.get(player.user_id) || 'Hoofdtoernooi';
      const cost = await calculatePlayerCost(player.user_id, className, tournamentIds);
      totalCost += cost;
    }

    // Validate budget (max 1000 points)
    if (totalCost > 1000) {
      throw ServiceError.validationFailed(`Budget overschreden! Totaal: ${totalCost} punten (max 1000)`);
    }

    // Validate reserve player if provided
    let reserveCost = 0;
    if (reservePlayerId) {
      // Get reserve player's class
      const reserveParticipation = await prisma.participation.findFirst({
        where: {
          user_id: reservePlayerId,
          tournament_id: { in: tournamentIds }
        },
        include: {
          tournament: {
            select: {
              class_name: true
            }
          }
        }
      });

      if (!reserveParticipation) {
        throw ServiceError.validationFailed('Reservespeler niet gevonden in het toernooi');
      }

      const reserveClassName = reserveParticipation.tournament.class_name || 'Hoofdtoernooi';
      reserveCost = await calculatePlayerCost(reservePlayerId, reserveClassName, tournamentIds);

      if (reserveCost > 100) {
        throw ServiceError.validationFailed(`Reservespeler mag maximaal 100 punten kosten (huidige kost: ${reserveCost})`);
      }
    }

    // Create new team (multiple teams per user allowed)
    const team = await prisma.megaschaakTeam.create({
      data: {
        user_id: targetUserId,
        tournament_id: tournamentId,
        team_name: teamName || 'Mijn Team',
        reserve_player_id: reservePlayerId || null,
        reserve_cost: reserveCost || null,
        players: {
          create: await Promise.all(players.map(async player => {
            const className = playerClassMap.get(player.user_id) || 'Hoofdtoernooi';
            const cost = await calculatePlayerCost(player.user_id, className, tournamentIds);
            return {
              player_id: player.user_id,
              cost
            };
          }))
        }
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
              }
            }
          }
        },
        reserve_player: {
          select: {
            user_id: true,
            voornaam: true,
            achternaam: true,
            schaakrating_elo: true,
            is_youth: true,
            avatar_url: true,
          }
        }
      }
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
  reservePlayerId?: number | null
) => {
  try {
    // First verify the team exists and belongs to the user
    const existingTeam = await prisma.megaschaakTeam.findFirst({
      where: {
        team_id: teamId,
        user_id: userId
      }
    });

    if (!existingTeam) {
      throw ServiceError.notFound('Team niet gevonden of je hebt geen toegang');
    }

    // Validate exactly 10 players
    if (playerIds.length !== 10) {
      throw ServiceError.validationFailed('Je moet precies 10 spelers selecteren');
    }

    // Validate reserve player is required
    if (!reservePlayerId) {
      throw ServiceError.validationFailed('Je moet nog een reservespeler selecteren!');
    }

    // Check if tournament deadline has passed
    const tournament = await prisma.tournament.findUnique({
      where: { tournament_id: existingTeam.tournament_id }
    });

    if (!tournament) {
      throw ServiceError.notFound('Toernooi niet gevonden');
    }

    if (tournament.megaschaak_deadline) {
      const now = new Date();
      if (now > tournament.megaschaak_deadline) {
        throw ServiceError.validationFailed('De inschrijvingsdeadline is verstreken. Je kan je team niet meer wijzigen.');
      }
    }

    // Get all tournaments with the same name (all classes)
    const allClassesTournaments = await prisma.tournament.findMany({
      where: { naam: tournament.naam }
    });
    const tournamentIds = allClassesTournaments.map(t => t.tournament_id);

    // Get all players and calculate total cost
    const players = await prisma.user.findMany({
      where: {
        user_id: { in: playerIds }
      },
      select: {
        user_id: true,
        schaakrating_elo: true
      }
    });

    // Get class information for each player
    const participations = await prisma.participation.findMany({
      where: {
        user_id: { in: playerIds },
        tournament_id: { in: tournamentIds }
      },
      include: {
        tournament: {
          select: {
            class_name: true
          }
        }
      }
    });

    const playerClassMap = new Map();
    for (const participation of participations) {
      if (!playerClassMap.has(participation.user_id)) {
        playerClassMap.set(participation.user_id, participation.tournament.class_name || 'Hoofdtoernooi');
      }
    }

    let totalCost = 0;
    for (const player of players) {
      const className = playerClassMap.get(player.user_id) || 'Hoofdtoernooi';
      const cost = await calculatePlayerCost(player.user_id, className, tournamentIds);
      totalCost += cost;
    }

    // Validate budget (max 1000 points)
    if (totalCost > 1000) {
      throw ServiceError.validationFailed(`Budget overschreden! Totaal: ${totalCost} punten (max 1000)`);
    }

    // Validate reserve player if provided
    let reserveCost: number | null = null;
    if (reservePlayerId) {
      // Get reserve player's class
      const reserveParticipation = await prisma.participation.findFirst({
        where: {
          user_id: reservePlayerId,
          tournament_id: { in: tournamentIds }
        },
        include: {
          tournament: {
            select: {
              class_name: true
            }
          }
        }
      });

      if (!reserveParticipation) {
        throw ServiceError.validationFailed('Reservespeler niet gevonden in het toernooi');
      }

      const reserveClassName = reserveParticipation.tournament.class_name || 'Hoofdtoernooi';
      reserveCost = await calculatePlayerCost(reservePlayerId, reserveClassName, tournamentIds);

      if (reserveCost > 100) {
        throw ServiceError.validationFailed(`Reservespeler mag maximaal 100 punten kosten (huidige kost: ${reserveCost})`);
      }
    }

    // Update team
    await prisma.megaschaakTeamPlayer.deleteMany({
      where: { team_id: teamId }
    });

    const team = await prisma.megaschaakTeam.update({
      where: { team_id: teamId },
      data: {
        team_name: teamName || existingTeam.team_name,
        reserve_player_id: reservePlayerId !== undefined ? reservePlayerId : existingTeam.reserve_player_id,
        reserve_cost: reservePlayerId !== undefined ? reserveCost : existingTeam.reserve_cost,
        players: {
          create: await Promise.all(players.map(async player => {
            const className = playerClassMap.get(player.user_id) || 'Hoofdtoernooi';
            const cost = await calculatePlayerCost(player.user_id, className, tournamentIds);
            return {
              player_id: player.user_id,
              cost
            };
          }))
        }
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
              }
            }
          }
        },
        reserve_player: {
          select: {
            user_id: true,
            voornaam: true,
            achternaam: true,
            schaakrating_elo: true,
            is_youth: true,
            avatar_url: true,
          }
        }
      }
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
        user_id: userId
      },
      include: {
        tournament: true
      }
    });

    if (!team) {
      throw ServiceError.notFound('Team niet gevonden of je hebt geen toegang');
    }

    // Check if registration deadline has passed
    if (team.tournament.megaschaak_deadline) {
      const now = new Date();
      if (now > team.tournament.megaschaak_deadline) {
        throw ServiceError.validationFailed('De inschrijvingsdeadline is verstreken. Je kan je team niet meer verwijderen.');
      }
    }

    await prisma.megaschaakTeam.delete({
      where: { team_id: teamId }
    });
  } catch (error) {
    throw handleDBError(error);
  }
};

/**
 * Enable or disable megaschaak for a tournament
 */
export const toggleMegaschaak = async (tournamentId: number, enabled: boolean) => {
  try {
    const tournament = await prisma.tournament.update({
      where: { tournament_id: tournamentId },
      data: { megaschaak_enabled: enabled }
    });

    return tournament;
  } catch (error) {
    throw handleDBError(error);
  }
};

/**
 * Set the registration deadline for megaschaak
 */
export const setMegaschaakDeadline = async (tournamentId: number, deadline: Date | null) => {
  try {
    const tournament = await prisma.tournament.update({
      where: { tournament_id: tournamentId },
      data: { megaschaak_deadline: deadline }
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

  // No result yet
  if (!game.result || game.result === 'not_played' || game.result === '...') {
    return 0;
  }

  // Check if player won
  if (game.winnaar_id === playerId) {
    return 1;
  }

  // Check for draw (½-½ or 1/2-1/2)
  if (game.result === '½-½' || game.result === '1/2-1/2') {
    return 0.5;
  }

  // Player lost
  return 0;
};

/**
 * Get cross-table data: teams vs players with scores
 */
export const getCrossTableData = async (tournamentId: number) => {
  try {
    // Get the tournament to find all related tournaments (all classes)
    const tournament = await prisma.tournament.findUnique({
      where: { tournament_id: tournamentId }
    });

    if (!tournament) {
      throw ServiceError.notFound('Toernooi niet gevonden');
    }

    // Find all tournaments with the same name (all classes)
    const allClassesTournaments = await prisma.tournament.findMany({
      where: {
        naam: tournament.naam,
        finished: false
      },
      include: {
        rounds: {
          include: {
            games: {
              include: {
                speler1: true,
                speler2: true,
                winnaar: true
              }
            }
          },
          orderBy: {
            ronde_nummer: 'asc'
          }
        }
      },
      orderBy: {
        class_name: 'asc'
      }
    });

    // Collect all games from all classes
    const allGames = allClassesTournaments.flatMap(t => 
      t.rounds.flatMap(r => r.games)
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
          }
        },
        players: {
          include: {
            player: {
              select: {
                user_id: true,
                voornaam: true,
                achternaam: true,
                schaakrating_elo: true,
              }
            }
          }
        }
      },
      orderBy: {
        team_name: 'asc'
      }
    });

    // Get all unique players across all teams with their class
    const playersMap = new Map();
    
    for (const tournament of allClassesTournaments) {
      const className = tournament.class_name || 'Hoofdtoernooi';
      for (const participation of (tournament as any).participations || []) {
        if (!playersMap.has(participation.user_id)) {
          playersMap.set(participation.user_id, {
            user_id: participation.user_id,
            className: className
          });
        }
      }
    }

    // Get all participations for player details
    const allParticipations = await prisma.participation.findMany({
      where: {
        tournament_id: { in: allClassesTournaments.map(t => t.tournament_id) }
      },
      include: {
        user: {
          select: {
            user_id: true,
            voornaam: true,
            achternaam: true,
            schaakrating_elo: true,
          }
        },
        tournament: {
          select: {
            class_name: true
          }
        }
      }
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
      (p) => !isExcludedFromMegaschaak(p.user.voornaam, p.user.achternaam)
    );
    const playersWithClass = await Promise.all(participationsForMegaschaak.map(async p => {
      // Get cost from team if available, otherwise calculate it
      let cost = playerCostMap.get(p.user.user_id);
      if (cost === undefined) {
        // Calculate cost if not in any team
        const className = p.tournament.class_name || 'Hoofdtoernooi';
        cost = await calculatePlayerCost(p.user.user_id, className, allClassesTournaments.map(t => t.tournament_id));
      }
      
      return {
        user_id: p.user.user_id,
        voornaam: p.user.voornaam,
        achternaam: p.user.achternaam,
        schaakrating_elo: p.user.schaakrating_elo,
        className: p.tournament.class_name || 'Hoofdtoernooi',
        tournamentScore: p.score || 0,
        tie_break: p.tie_break || 0,
        cost: cost
      };
    }));

    // Remove duplicates (keep first occurrence)
    const uniquePlayers = Array.from(
      new Map(playersWithClass.map(p => [p.user_id, p])).values()
    );

    // Custom sort order for class names
    const classOrder = [
      'Hoofdtoernooi',
      'Eerste Klasse',
      'Tweede Klasse',
      'Derde Klasse',
      'Vierde Klasse',
      'Vijfde Klasse',
      'Vierde en Vijfde Klasse',
      'Zesde Klasse',
      'Zevende Klasse',
      'Achtste Klasse'
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

    // Calculate scores for each team-player combination
    const crossTable = teams.map(team => {
      const playerScores = uniquePlayers.map(player => {
        // Check if this player is in the team
        const isInTeam = team.players.some(tp => tp.player_id === player.user_id);
        
        if (!isInTeam) {
          return { player_id: player.user_id, score: null, inTeam: false };
        }

        // Calculate total score for this player across all games
        const score = allGames.reduce((sum, game) => {
          return sum + calculateGameScore(game, player.user_id);
        }, 0);

        return { player_id: player.user_id, score, inTeam: true };
      });

      const totalScore = playerScores.reduce((sum, ps) => sum + (ps.score || 0), 0);

      // Calculate total cost: sum of all player costs only (reserve cost not included)
      const totalCost = team.players.reduce((sum, tp) => sum + tp.cost, 0);

      return {
        team_id: team.team_id,
        team_name: team.team_name,
        user: team.user,
        playerScores,
        totalScore,
        totalCost
      };
    });

    // Sort teams by total score
    crossTable.sort((a, b) => b.totalScore - a.totalScore);

    return {
      teams: crossTable,
      players: uniquePlayers
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
      where: { tournament_id: tournamentId }
    });

    if (!tournament) {
      throw ServiceError.notFound('Toernooi niet gevonden');
    }

    // Find all tournaments with the same name (all classes)
    const allClassesTournaments = await prisma.tournament.findMany({
      where: {
        naam: tournament.naam,
        finished: false
      },
      include: {
        rounds: {
          include: {
            games: {
              include: {
                speler1: true,
                speler2: true,
                winnaar: true
              }
            }
          },
          orderBy: {
            ronde_nummer: 'asc'
          }
        }
      }
    });

    // Collect all games from all classes
    const allGames = allClassesTournaments.flatMap(t => 
      t.rounds.flatMap(r => r.games)
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
          }
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
              }
            }
          }
        }
      }
    });

    // Calculate scores for each team
    const teamsWithScores = teams.map(team => {
      let totalScore = 0;
      const playerScores = team.players.map(tp => {
        // Calculate total score for this player across all games
        const playerScore = allGames.reduce((sum, game) => {
          return sum + calculateGameScore(game, tp.player_id);
        }, 0);

        totalScore += playerScore;

        return {
          ...tp,
          score: playerScore
        };
      });

      // Calculate total cost: sum of all player costs only (reserve cost not included)
      const totalCost = team.players.reduce((sum, tp) => sum + tp.cost, 0);

      return {
        ...team,
        players: playerScores,
        totalScore,
        totalCost
      };
    });

    // Sort teams by total score (descending)
    teamsWithScores.sort((a, b) => b.totalScore - a.totalScore);

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
          }
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
              }
            }
          }
        },
        tournament: true
      }
    });

    if (!team) {
      throw ServiceError.notFound('Team niet gevonden');
    }

    // Find all tournaments with the same name (all classes)
    const allClassesTournaments = await prisma.tournament.findMany({
      where: {
        naam: team.tournament.naam,
        finished: false
      },
      include: {
        rounds: {
          where: {
            type: 'REGULAR' // Only regular rounds, no makeup rounds
          },
          include: {
            games: {
              include: {
                speler1: true,
                speler2: true,
                winnaar: true,
                round: true
              }
            }
          },
          orderBy: {
            ronde_nummer: 'asc'
          }
        }
      }
    });

    // Get all rounds (sorted) - only REGULAR rounds
    const allRounds = allClassesTournaments
      .flatMap(t => t.rounds)
      .filter(round => round.type === 'REGULAR') // Extra filter to be safe
      .sort((a, b) => a.ronde_nummer - b.ronde_nummer);

    // Group games by round number
    const gamesByRound = new Map();
    allRounds.forEach(round => {
      if (!gamesByRound.has(round.ronde_nummer)) {
        gamesByRound.set(round.ronde_nummer, []);
      }
      gamesByRound.get(round.ronde_nummer).push(...round.games);
    });

    // Calculate scores per player per round
    const playerScoresByRound = team.players.map(tp => {
      const roundScores = Array.from(gamesByRound.entries()).map(([rondeNummer, games]) => {
        // Find if player has a game in this round
        const playerGame = games.find((game: any) => 
          game.speler1_id === tp.player_id || game.speler2_id === tp.player_id
        );
        
        // If no game, return null to indicate no game played
        if (!playerGame) {
          return {
            ronde_nummer: rondeNummer,
            score: null,
            hasGame: false
          };
        }
        
        // Check if it's a BYE (speler2_id is null)
        const isBye = playerGame.speler2_id === null;
        
        // Check if game has a result
        const hasResult = playerGame.result && 
          playerGame.result !== 'not_played' && 
          playerGame.result !== '...' &&
          playerGame.result !== 'uitgesteld';
        
        const score = calculateGameScore(playerGame, tp.player_id);
        
        // If score is 0 and (no result or BYE), return null
        if (score === 0 && (!hasResult || isBye)) {
          return {
            ronde_nummer: rondeNummer,
            score: null,
            hasGame: true
          };
        }

        return {
          ronde_nummer: rondeNummer,
          score
        };
      });

      const totalScore = roundScores.reduce((sum, rs) => sum + (rs.score ?? 0), 0);

      return {
        ...tp,
        roundScores,
        totalScore
      };
    });

    return {
      ...team,
      players: playerScoresByRound,
      rounds: Array.from(gamesByRound.keys()).sort((a, b) => a - b)
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
      where: { tournament_id: tournamentId }
    });

    if (!tournament) {
      throw ServiceError.notFound('Toernooi niet gevonden');
    }

    // Get all tournaments with the same name (all classes)
    const allClassesTournaments = await prisma.tournament.findMany({
      where: { naam: tournament.naam }
    });

    const tournamentIds = allClassesTournaments.map(t => t.tournament_id);

    // Get all teams for this tournament
    const teams = await prisma.megaschaakTeam.findMany({
      where: {
        tournament_id: { in: tournamentIds }
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
              }
            }
          }
        }
      }
    });

    // Count player selections
    const playerSelectionCount = new Map<number, {
      player: any
      cost: number
      selectionCount: number
      className: string
    }>();

    for (const team of teams) {
      for (const teamPlayer of team.players) {
        const playerId = teamPlayer.player_id;
        if (!playerSelectionCount.has(playerId)) {
          // Get player's class
          const participation = await prisma.participation.findFirst({
            where: {
              user_id: playerId,
              tournament_id: { in: tournamentIds }
            },
            include: {
              tournament: {
                select: {
                  class_name: true
                }
              }
            }
          });

          playerSelectionCount.set(playerId, {
            player: teamPlayer.player,
            cost: teamPlayer.cost,
            selectionCount: 1,
            className: participation?.tournament.class_name || 'Hoofdtoernooi'
          });
        } else {
          const existing = playerSelectionCount.get(playerId)!;
          existing.selectionCount++;
        }
      }
    }

    // Convert to array and sort by selection count
    const popularPlayers = Array.from(playerSelectionCount.values())
      .sort((a, b) => b.selectionCount - a.selectionCount)
      .slice(0, 20); // Top 20

    return popularPlayers.map(p => ({
      user_id: p.player.user_id,
      voornaam: p.player.voornaam,
      achternaam: p.player.achternaam,
      schaakrating_elo: p.player.schaakrating_elo,
      cost: p.cost,
      selectionCount: p.selectionCount,
      className: p.className
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
      where: { tournament_id: tournamentId }
    });

    if (!tournament) {
      throw ServiceError.notFound('Toernooi niet gevonden');
    }

    // Get all tournaments with the same name (all classes)
    const allClassesTournaments = await prisma.tournament.findMany({
      where: { naam: tournament.naam },
      select: {
        tournament_id: true,
        class_name: true,
        rondes: true
      }
    });

    const tournamentIds = allClassesTournaments.map(t => t.tournament_id);

    // Get all teams for this tournament
    const teams = await prisma.megaschaakTeam.findMany({
      where: {
        tournament_id: { in: tournamentIds }
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
              }
            }
          }
        }
      }
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
        tournament_id: { in: tournamentIds }
      },
      include: {
        user: {
          select: {
            user_id: true,
            voornaam: true,
            achternaam: true,
            schaakrating_elo: true,
          }
        },
        tournament: {
          select: {
            class_name: true
          }
        }
      }
    });

    // Collect unique players (all participants, not just those in teams); exclude Lode e.a. uit megaschaak
    const playerData = new Map<number, {
      player: any
      cost: number
      totalScore: number
      gamesPlayed: number
      className: string
    }>();

    const participationsForValue = allParticipations.filter(
      (p) => !isExcludedFromMegaschaak(p.user.voornaam, p.user.achternaam)
    );
    for (const participation of participationsForValue) {
      const playerId = participation.user.user_id;
      
      if (!playerData.has(playerId)) {
        // Get cost from team if available, otherwise calculate it
        let playerCost = teamPlayerCosts.get(playerId);
        if (!playerCost) {
          // Calculate cost if not in any team
          const className = participation.tournament.class_name || 'Hoofdtoernooi';
          playerCost = await calculatePlayerCost(playerId, className, tournamentIds);
        }

        playerData.set(playerId, {
          player: participation.user,
          cost: playerCost,
          totalScore: 0,
          gamesPlayed: 0,
          className: participation.tournament.class_name || 'Hoofdtoernooi'
        });
      }
    }

    // Helper function: check if result represents a game that should count as played
    // Excludes: null, "not_played", "...", "uitgesteld", absences ("ABS-", "0.5-0"), and invalid results ("0-0")
    // Includes: regular games ("1-0", "0-1", "½-½", "1/2-1/2", "-"), forfeits ("1-0R", "0-1R")
    const isPlayedGame = (result: string | null, speler2_id: number | null): boolean => {
      // BYE games don't count
      if (speler2_id === null) return false;
      
      if (!result || result === "not_played" || result === "..." || result === "uitgesteld") return false;
      // Exclude absences with message (results starting with 'ABS-')
      if (result.startsWith("ABS-")) return false;
      // Exclude "0.5-0" which is an absence with message
      if (result === "0.5-0") return false;
      // Exclude "0-0" which is an invalid/unplayed result
      if (result === "0-0") return false;
      // Only count valid game results: wins, losses, draws, and forfeits
      return result === "1-0" || result === "0-1" || result === "1-0R" || result === "0-1R" ||
             result === "½-½" || result === "1/2-1/2" || result === "-";
    };

    // Calculate scores for each player
    for (const [playerId, data] of playerData.entries()) {
      const games = await prisma.game.findMany({
        where: {
          OR: [
            { speler1_id: playerId },
            { speler2_id: playerId }
          ],
          round: {
            tournament_id: { in: tournamentIds }
          },
          result: { not: null }
        },
        include: {
          round: true
        }
      });

      let totalScore = 0;
      let gamesPlayedCount = 0;
      for (const game of games) {
        const score = calculateGameScore(game, playerId);
        totalScore += score;
        
        // Only count games that were actually played (using same logic as isPlayedGame)
        if (isPlayedGame(game.result, game.speler2_id)) {
          gamesPlayedCount++;
        }
      }

      data.totalScore = totalScore;
      data.gamesPlayed = gamesPlayedCount;
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
    Object.keys(config.roundsPerClass).forEach(className => {
      if (config.roundsPerClass[className]) {
        roundsPerClassMap[className] = config.roundsPerClass[className];
      }
    });

    // Calculate value ratio (include all players, even those without games)
    const valuePlayers = Array.from(playerData.values())
      .map(p => {
        // Get total rounds for this player's class
        const totalRounds = roundsPerClassMap[p.className] || 11; // Default to 11 if not found
        
        return {
          user_id: p.player.user_id,
          voornaam: p.player.voornaam,
          achternaam: p.player.achternaam,
          schaakrating_elo: p.player.schaakrating_elo,
          cost: p.cost,
          totalScore: p.totalScore,
          gamesPlayed: p.gamesPlayed,
          valueRatio: p.totalScore / totalRounds, // Points per total rounds to be played
          className: p.className
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
        tournament_id: tournamentId
      },
      include: {
        user: {
          select: {
            user_id: true,
            voornaam: true,
            achternaam: true,
            email: true
          }
        },
        players: {
          include: {
            player: {
              select: {
                user_id: true,
                voornaam: true,
                achternaam: true,
                schaakrating_elo: true
              }
            }
          }
        },
        reserve_player: {
          select: {
            user_id: true,
            voornaam: true,
            achternaam: true,
            schaakrating_elo: true
          }
        }
      },
      orderBy: [
        { created_at: 'desc' }
      ]
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
      where: { team_id: teamId }
    });

    if (!team) {
      throw ServiceError.notFound('Team niet gevonden');
    }

    await prisma.megaschaakTeam.delete({
      where: { team_id: teamId }
    });
  } catch (error) {
    throw handleDBError(error);
  }
};

/**
 * Get megaschaak configuration for a tournament (admin only)
 */
export const getMegaschaakConfiguration = async (tournamentId: number): Promise<MegaschaakConfig> => {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { tournament_id: tournamentId },
      select: { megaschaak_config: true }
    });

    if (!tournament) {
      throw ServiceError.notFound('Toernooi niet gevonden');
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
  config: Partial<MegaschaakConfig>
): Promise<MegaschaakConfig> => {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { tournament_id: tournamentId }
    });

    if (!tournament) {
      throw ServiceError.notFound('Toernooi niet gevonden');
    }

    // Get current config and merge with new values
    const currentConfig = await getMegaschaakConfig([tournamentId]);
    const updatedConfig: MegaschaakConfig = {
      classBonusPoints: { ...currentConfig.classBonusPoints, ...(config.classBonusPoints || {}) },
      roundsPerClass: { ...currentConfig.roundsPerClass, ...(config.roundsPerClass || {}) },
      correctieMultiplier: config.correctieMultiplier ?? currentConfig.correctieMultiplier,
      correctieSubtract: config.correctieSubtract ?? currentConfig.correctieSubtract,
      minCost: config.minCost ?? currentConfig.minCost,
      maxCost: config.maxCost ?? currentConfig.maxCost
    };

    // Find all tournaments with the same name (all classes should share the same config)
    const allClassesTournaments = await prisma.tournament.findMany({
      where: {
        naam: tournament.naam
      },
      select: {
        tournament_id: true
      }
    });

    // Update all tournaments with the same name with the new config
    await prisma.tournament.updateMany({
      where: {
        tournament_id: { in: allClassesTournaments.map(t => t.tournament_id) }
      },
      data: {
        megaschaak_config: updatedConfig as any
      }
    });

    return updatedConfig;
  } catch (error) {
    throw handleDBError(error);
  }
};

