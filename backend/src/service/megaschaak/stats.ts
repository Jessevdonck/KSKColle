import { prisma } from "../data";
import ServiceError from "../../core/serviceError";
import handleDBError from "../handleDBError";

import { megaschaakRoundTypesFilter } from "./constants";
import { getMegaschaakCompetitionTournamentIds } from "./competition";
import { calculatePlayerCost, getMegaschaakConfig } from "./config";
import { isExcludedFromMegaschaak } from "./exclusions";
import * as games from "./games";

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

    const makeupByOriginalIdValue = await games.buildMakeupByOriginalIdMap(
      allClassesTournaments,
    );
    const allGamesValue = await games.collectDedupedMegaschaakGames(
      allClassesTournaments,
      makeupByOriginalIdValue,
    );
    const gamesByRoundValue = new Map<number, any[]>();
    for (const g of allGamesValue) {
      const rn = g._megaschaak_round?.ronde_nummer ?? 0;
      if (!gamesByRoundValue.has(rn)) gamesByRoundValue.set(rn, []);
      gamesByRoundValue.get(rn)!.push(g);
    }
    const roundsSortedValue = games.getPlannedMegaschaakRounds(allClassesTournaments);

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
      data.gamesPlayed = games.countMegaschaakGamesPlayedFromRoundResolution(
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
    const competitionTournamentIds =
      await getMegaschaakCompetitionTournamentIds(tournamentId);

    const teams = await prisma.megaschaakTeam.findMany({
      where: {
        tournament_id: { in: competitionTournamentIds },
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
