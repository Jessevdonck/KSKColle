import { prisma } from "../data";
import ServiceError from "../../core/serviceError";
import handleDBError from "../handleDBError";

import { getMegaschaakCompetitionTournamentIds } from "./competition";
import { calculatePlayerCost } from "./config";

export const getUserTeams = async (userId: number, tournamentId: number) => {
  try {
    const competitionTournamentIds =
      await getMegaschaakCompetitionTournamentIds(tournamentId);

    const teams = await prisma.megaschaakTeam.findMany({
      where: {
        user_id: userId,
        tournament_id: { in: competitionTournamentIds },
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
