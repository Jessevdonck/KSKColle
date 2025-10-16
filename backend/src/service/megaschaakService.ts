import { prisma } from "./data";
import ServiceError from "../core/serviceError";
import handleDBError from "./handleDBError";

/**
 * Calculate the cost of a player based on their rating
 * Formula: Base cost based on rating with some logic
 */
/**
 * Calculate bonus points based on class
 */
const getBonusPointsByClass = (className: string): number => {
  const classMap: { [key: string]: number } = {
    'Eerste Klasse': 0,
    'Tweede Klasse': 110,
    'Derde Klasse': 190,
    'Vierde Klasse': 270,
    'Vijfde Klasse': 330,
    'Vierde en Vijfde Klasse': 330, // Fallback for combined classes
    'Zesde Klasse': 330,
    'Zevende Klasse': 330,
    'Achtste Klasse': 330,
    'Hoofdtoernooi': 0 // Default fallback
  };
  
  return classMap[className] || 0;
};

/**
 * Calculate TPR (Tournament Performance Rating) for a player
 * Simplified version: for now just return the player's current rating
 * In the future this could be enhanced with actual tournament performance
 */
const calculateTPR = async (playerId: number): Promise<number> => {
  // For now, just return the player's current rating
  // This matches the Excel formula where TPR is used but not explicitly calculated
  const player = await prisma.user.findUnique({
    where: { user_id: playerId },
    select: { schaakrating_elo: true }
  });
  return player?.schaakrating_elo || 1500;
};

/**
 * Calculate megaschaak cost using the Excel formulas
 */
export const calculatePlayerCost = async (playerId: number, className: string, _tournamentIds: number[]): Promise<number> => {
  try {
    // Get player rating
    const player = await prisma.user.findUnique({
      where: { user_id: playerId },
      select: { schaakrating_elo: true }
    });

    if (!player) return 50; // Default fallback

    const rating = player.schaakrating_elo;

    // 1. Bonus Pt(kl) based on class
    const bonusPoints = getBonusPointsByClass(className);

    // 2. Calculate TPR
    const tpr = await calculateTPR(playerId);

    // 3. Pt(ELO) = (Rating + TPR) / 2
    const ptELO = (rating + tpr) / 2;

    // 4. Pt(tot) = Bonus Pt(kl) + Pt(ELO)
    const ptTot = bonusPoints + ptELO;

    // 5. Correctie = Pt(tot) * 1.5 - 1800
    const correctie = ptTot * 1.5 - 1800;

    // 6. Megaschaak kost = MROUND(Correctie, 10) / 10
    const megaschaakCost = Math.round(correctie / 10) * 10 / 10;

    // Ensure minimum cost of 1 and reasonable maximum
    return Math.max(1, Math.min(200, megaschaakCost));
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

    // Convert to array and add costs
    const playersWithCosts = [];
    for (const user of participantsMap.values()) {
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

    // Build players list with class info and their tournament score
    const playersWithClass = allParticipations.map(p => ({
      user_id: p.user.user_id,
      voornaam: p.user.voornaam,
      achternaam: p.user.achternaam,
      schaakrating_elo: p.user.schaakrating_elo,
      className: p.tournament.class_name || 'Hoofdtoernooi',
      tournamentScore: p.score || 0,
      tie_break: p.tie_break || 0
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

      return {
        team_id: team.team_id,
        team_name: team.team_name,
        user: team.user,
        playerScores,
        totalScore
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

      return {
        ...team,
        players: playerScores,
        totalScore
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

    // Get all rounds (sorted)
    const allRounds = allClassesTournaments
      .flatMap(t => t.rounds)
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
        const score = games.reduce((sum: number, game: any) => {
          return sum + calculateGameScore(game, tp.player_id);
        }, 0);

        return {
          ronde_nummer: rondeNummer,
          score
        };
      });

      const totalScore = roundScores.reduce((sum, rs) => sum + rs.score, 0);

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

    // Collect unique players
    const playerData = new Map<number, {
      player: any
      cost: number
      totalScore: number
      gamesPlayed: number
      className: string
    }>();

    for (const team of teams) {
      for (const teamPlayer of team.players) {
        const playerId = teamPlayer.player_id;
        
        if (!playerData.has(playerId)) {
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

          playerData.set(playerId, {
            player: teamPlayer.player,
            cost: teamPlayer.cost,
            totalScore: 0,
            gamesPlayed: 0,
            className: participation?.tournament.class_name || 'Hoofdtoernooi'
          });
        }
      }
    }

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
      for (const game of games) {
        totalScore += calculateGameScore(game, playerId);
      }

      data.totalScore = totalScore;
      data.gamesPlayed = games.length;
    }

    // Calculate value ratio and filter players with at least 1 game
    const valuePlayers = Array.from(playerData.values())
      .filter(p => p.gamesPlayed > 0)
      .map(p => ({
        user_id: p.player.user_id,
        voornaam: p.player.voornaam,
        achternaam: p.player.achternaam,
        schaakrating_elo: p.player.schaakrating_elo,
        cost: p.cost,
        totalScore: p.totalScore,
        gamesPlayed: p.gamesPlayed,
        valueRatio: p.totalScore / p.cost, // Points per cost unit
        className: p.className
      }))
      .sort((a, b) => b.valueRatio - a.valueRatio)
      .slice(0, 20); // Top 20

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

