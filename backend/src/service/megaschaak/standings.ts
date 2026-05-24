import { prisma } from "../data";
import ServiceError from "../../core/serviceError";
import handleDBError from "../handleDBError";

import { megaschaakRoundTypesFilter } from "./constants";
import { calculatePlayerCost } from "./config";
import { getMegaschaakCompetitionTournamentIds } from "./competition";
import {
  getMegaschaakExcludedUserIds,
  isExcludedFromMegaschaak,
  isMegaschaakLentecompetitieNaam,
  getLodeVanLandeghemUserId,
} from "./exclusions";
import * as games from "./games";

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

    const makeupByOriginalIdCross = await games.buildMakeupByOriginalIdMap(
      allClassesTournaments,
    );
    const allGames = await games.collectDedupedMegaschaakGames(
      allClassesTournaments,
      makeupByOriginalIdCross,
    );
    const gamesByRoundCross = new Map<number, any[]>();
    for (const g of allGames) {
      const rn = g._megaschaak_round?.ronde_nummer ?? 0;
      if (!gamesByRoundCross.has(rn)) gamesByRoundCross.set(rn, []);
      gamesByRoundCross.get(rn)!.push(g);
    }
    const roundsSortedCross = games.getPlannedMegaschaakRounds(allClassesTournaments);

    const competitionTournamentIds =
      await getMegaschaakCompetitionTournamentIds(tournamentId);

    // Get all teams for this competition (all classes)
    const teams = await prisma.megaschaakTeam.findMany({
      where: { tournament_id: { in: competitionTournamentIds } },
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
      gamesPlayed: games.countMegaschaakGamesPlayedFromRoundResolution(
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
        games.getAdjustedReserveScoreAndGamesForJesseReplacement(
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
                : games.countMegaschaakGamesPlayedFromRoundResolution(
                    tp.player_id,
                    tournamentId,
                    playerCompetitionTournamentIdCross,
                    allClassesTournaments,
                    makeupByOriginalIdCross,
                    gamesByRoundCross,
                    roundsSortedCross,
                  )
            : games.countMegaschaakGamesPlayedFromRoundResolution(
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
      const totalCost = games.megaschaakTeamPloegWaardeCost(team);

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

    const makeupByOriginalIdStandings = await games.buildMakeupByOriginalIdMap(
      allClassesTournaments,
    );
    const allGames = await games.collectDedupedMegaschaakGames(
      allClassesTournaments,
      makeupByOriginalIdStandings,
    );
    const gamesByRoundStandings = new Map<number, any[]>();
    for (const g of allGames) {
      const rn = g._megaschaak_round?.ronde_nummer ?? 0;
      if (!gamesByRoundStandings.has(rn)) gamesByRoundStandings.set(rn, []);
      gamesByRoundStandings.get(rn)!.push(g);
    }
    const roundsSortedStandings = games.getPlannedMegaschaakRounds(
      allClassesTournaments,
    );

    const competitionTournamentIds =
      await getMegaschaakCompetitionTournamentIds(tournamentId);

    // Get all teams for this competition (all classes)
    const teams = await prisma.megaschaakTeam.findMany({
      where: { tournament_id: { in: competitionTournamentIds } },
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
        games.getAdjustedReserveScoreAndGamesForJesseReplacement(
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
                : games.countMegaschaakGamesPlayedFromRoundResolution(
                    tp.player_id,
                    team.tournament_id,
                    playerCompetitionTournamentIdStandings,
                    allClassesTournaments,
                    makeupByOriginalIdStandings,
                    gamesByRoundStandings,
                    roundsSortedStandings,
                  )
            : games.countMegaschaakGamesPlayedFromRoundResolution(
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

      const totalCost = games.megaschaakTeamPloegWaardeCost(team);

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

    const makeupByOriginalId = await games.buildMakeupByOriginalIdMap(
      allClassesTournaments,
    );
    const dedupedGames = await games.collectDedupedMegaschaakGames(
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

    const roundsSorted = games.getPlannedMegaschaakRounds(allClassesTournaments);
    const isLenteCompetition = isMegaschaakLentecompetitieNaam(
      team.tournament.naam,
      team.tournament.class_name,
    );
    const lodeUserId = isLenteCompetition
      ? await getLodeVanLandeghemUserId()
      : null;
    const replacementIds = games.getJesseReserveReplacementIds(team);
    const megaschaakExcludedUserIds = await getMegaschaakExcludedUserIds();

    // Calculate scores per player per round
    const playerScoresByRound = team.players.map((tp) => {
      if (megaschaakExcludedUserIds.has(tp.player_id)) {
        const byeRoundScores = roundsSorted.map((rondeNummer) => ({
          ronde_nummer: rondeNummer,
          score: null,
          hasGame: false,
          isForfeitLoss: false,
          isBye: false,
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
        const rawRoundGame = games.getRawRoundGameForPlayer(
          tp.player_id,
          playerTid,
          rondeNummer,
          allClassesTournaments,
        );

        const byeDisplay = games.resolveMegaschaakRoundByeDisplay(
          tp.player_id,
          playerTid,
          rondeNummer,
          allClassesTournaments,
          rawRoundGame,
          lodeUserId,
          isLenteCompetition,
        );
        if (byeDisplay) {
          return {
            ronde_nummer: rondeNummer,
            score: byeDisplay.score,
            hasGame: false,
            isForfeitLoss: false,
            isBye: true,
          };
        }

        const isForfeitLoss =
          rawRoundGame != null &&
          games.isForfeitLossForPlayer(rawRoundGame, tp.player_id);

        if (replacementIds && tp.player_id === replacementIds.forfaitPlayerId) {
          const forfaitPlayerTid =
            playerCompetitionTournamentId.get(replacementIds.forfaitPlayerId) ??
            teamTid;
          const forfaitRawRoundGame = games.getRawRoundGameForPlayer(
            replacementIds.forfaitPlayerId,
            forfaitPlayerTid,
            rondeNummer,
            allClassesTournaments,
          );
          if (
            forfaitRawRoundGame &&
            games.isForfeitLossForPlayer(
              forfaitRawRoundGame,
              replacementIds.forfaitPlayerId,
            )
          ) {
            return {
              ronde_nummer: rondeNummer,
              score: null,
              hasGame: false,
              isForfeitLoss: true,
              isBye: false,
            };
          }
        }

        const score = games.getRoundScoreFromRoundResolution(
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
            isBye: false,
          };
        }

        if (replacementIds && tp.player_id === replacementIds.reservePlayerId) {
          const forfaitPlayerTid =
            playerCompetitionTournamentId.get(replacementIds.forfaitPlayerId) ??
            teamTid;
          const forfaitRawRoundGame = games.getRawRoundGameForPlayer(
            replacementIds.forfaitPlayerId,
            forfaitPlayerTid,
            rondeNummer,
            allClassesTournaments,
          );
          const forfaitHasAnyRoundEntry = forfaitRawRoundGame != null;
          const forfaitHasBye = forfaitRawRoundGame?.speler2_id == null;
          const forfaitForfeitLoss = games.isForfeitLossForPlayer(
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
              isBye: false,
            };
          }
        }

        return {
          ronde_nummer: rondeNummer,
          score,
          isForfeitLoss,
          isBye: false,
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

