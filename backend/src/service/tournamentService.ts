import { prisma } from "./data";
import { Prisma } from "@prisma/client";
import type { Tournament, TournamentCreateInput, TournamentUpdateInput } from "../types/tournament";
import type { Participation } from "../types/participation";
import ServiceError from "../core/serviceError";
import handleDBError from "./handleDBError";

export const getAllTournaments = async (
  active?: boolean,   // undefined | true | false
  is_youth?: boolean  // undefined | true | false
): Promise<Tournament[]> => {
  try {
    const where: Prisma.TournamentWhereInput = {};

    // If filtering for active tournaments, we need special logic for herfstcompetitie and lentecompetitie
    if (typeof active === 'boolean' && active === true) {
      // First, get all tournaments (both finished and unfinished) to find the latest herfst/lente
      const allTournaments = await prisma.tournament.findMany({
        where: typeof is_youth === 'boolean' ? { is_youth } : {},
        include: {
          participations: { include: { user: true } },
          rounds: { 
            include: { 
              games: { 
                select: {
                  game_id: true,
                  round_id: true,
                  speler1_id: true,
                  speler2_id: true,
                  winnaar_id: true,
                  result: true,
                  uitgestelde_datum: true,
                  board_position: true,
                  original_game_id: true,
                  speler1: true,
                  speler2: true,
                  winnaar: true,
                },
              } 
            },
            orderBy: {
              ronde_datum: 'desc'
            }
          },
        },
        orderBy: {
          tournament_id: 'desc'
        }
      });

      // Find the latest herfstcompetitie and lentecompetitie tournaments
      // Use the last round date to determine which is the newest
      type TournamentWithRelations = typeof allTournaments[0];
      let latestHerfst: TournamentWithRelations | null = null;
      let latestLente: TournamentWithRelations | null = null;
      let latestHerfstDate: Date | null = null;
      let latestLenteDate: Date | null = null;

      for (const tournament of allTournaments) {
        const name = tournament.naam.toLowerCase();
        const isHerfst = name.includes('herfst') || name.includes('herfstcompetitie');
        const isLente = name.includes('lente') || name.includes('lentecompetitie');

        // Get the last round date for this tournament
        const lastRoundDate = tournament.rounds && tournament.rounds.length > 0 && tournament.rounds[0]
          ? tournament.rounds[0].ronde_datum
          : null;

        if (isHerfst) {
          if (!latestHerfst || (lastRoundDate && latestHerfstDate && lastRoundDate > latestHerfstDate)) {
            latestHerfst = tournament;
            latestHerfstDate = lastRoundDate;
          } else if (!latestHerfstDate && lastRoundDate) {
            // If we don't have a date yet, use this one
            latestHerfst = tournament;
            latestHerfstDate = lastRoundDate;
          } else if (!latestHerfstDate && !lastRoundDate && tournament.tournament_id > (latestHerfst?.tournament_id || 0)) {
            // Fallback to tournament_id if no dates available
            latestHerfst = tournament;
          }
        }

        if (isLente) {
          if (!latestLente || (lastRoundDate && latestLenteDate && lastRoundDate > latestLenteDate)) {
            latestLente = tournament;
            latestLenteDate = lastRoundDate;
          } else if (!latestLenteDate && lastRoundDate) {
            // If we don't have a date yet, use this one
            latestLente = tournament;
            latestLenteDate = lastRoundDate;
          } else if (!latestLenteDate && !lastRoundDate && tournament.tournament_id > (latestLente?.tournament_id || 0)) {
            // Fallback to tournament_id if no dates available
            latestLente = tournament;
          }
        }
      }

      // Get active tournaments (finished = false)
      where.finished = false;
      if (typeof is_youth === 'boolean') {
        where.is_youth = is_youth;
      }

      const activeTournaments = await prisma.tournament.findMany({
        where,
        include: {
          participations: { include: { user: true } },
          rounds: { 
            include: { 
              games: { 
                select: {
                  game_id: true,
                  round_id: true,
                  speler1_id: true,
                  speler2_id: true,
                  winnaar_id: true,
                  result: true,
                  uitgestelde_datum: true,
                  board_position: true,
                  original_game_id: true,
                  speler1: true,
                  speler2: true,
                  winnaar: true,
                },
              } 
            },
            orderBy: {
              ronde_datum: 'desc'
            }
          },
        },
      });

      // Check if there's a newer herfstcompetitie or lentecompetitie in active tournaments
      // Compare by last round date, or tournament_id if no dates available
      const hasNewerHerfst = activeTournaments.some(t => {
        const name = t.naam.toLowerCase();
        if (!(name.includes('herfst') || name.includes('herfstcompetitie'))) return false;
        if (!latestHerfst) return false;
        
        const tLastRoundDate = t.rounds && t.rounds.length > 0 && t.rounds[0] ? t.rounds[0].ronde_datum : null;
        if (tLastRoundDate && latestHerfstDate) {
          return tLastRoundDate > latestHerfstDate;
        }
        // Fallback to tournament_id comparison
        return t.tournament_id > latestHerfst.tournament_id;
      });

      const hasNewerLente = activeTournaments.some(t => {
        const name = t.naam.toLowerCase();
        if (!(name.includes('lente') || name.includes('lentecompetitie'))) return false;
        if (!latestLente) return false;
        
        const tLastRoundDate = t.rounds && t.rounds.length > 0 && t.rounds[0] ? t.rounds[0].ronde_datum : null;
        if (tLastRoundDate && latestLenteDate) {
          return tLastRoundDate > latestLenteDate;
        }
        // Fallback to tournament_id comparison
        return t.tournament_id > latestLente.tournament_id;
      });

      // Add latest herfstcompetitie if no newer one exists and it's not already in the list
      const resultTournaments: typeof activeTournaments = [...activeTournaments];
      if (latestHerfst && !hasNewerHerfst && !resultTournaments.find(t => t.tournament_id === latestHerfst!.tournament_id)) {
        // Check is_youth filter
        if (typeof is_youth === 'boolean' ? latestHerfst.is_youth === is_youth : true) {
          // Ensure latestHerfst has the same structure as activeTournaments
          const herfstWithRounds = await prisma.tournament.findUnique({
            where: { tournament_id: latestHerfst.tournament_id },
            include: {
              participations: { include: { user: true } },
              rounds: { 
                include: { 
                  games: { 
                    select: {
                      game_id: true,
                      round_id: true,
                      speler1_id: true,
                      speler2_id: true,
                      winnaar_id: true,
                      result: true,
                      uitgestelde_datum: true,
                      board_position: true,
                      original_game_id: true,
                      speler1: true,
                      speler2: true,
                      winnaar: true,
                    },
                  } 
                },
                orderBy: {
                  ronde_datum: 'desc'
                }
              },
            },
          });
          if (herfstWithRounds) {
            resultTournaments.push(herfstWithRounds);
          }
        }
      }

      if (latestLente && !hasNewerLente && !resultTournaments.find(t => t.tournament_id === latestLente!.tournament_id)) {
        // Check is_youth filter
        if (typeof is_youth === 'boolean' ? latestLente.is_youth === is_youth : true) {
          // Ensure latestLente has the same structure as activeTournaments
          const lenteWithRounds = await prisma.tournament.findUnique({
            where: { tournament_id: latestLente.tournament_id },
            include: {
              participations: { include: { user: true } },
              rounds: { 
                include: { 
                  games: { 
                    select: {
                      game_id: true,
                      round_id: true,
                      speler1_id: true,
                      speler2_id: true,
                      winnaar_id: true,
                      result: true,
                      uitgestelde_datum: true,
                      board_position: true,
                      original_game_id: true,
                      speler1: true,
                      speler2: true,
                      winnaar: true,
                    },
                  } 
                },
                orderBy: {
                  ronde_datum: 'desc'
                }
              },
            },
          });
          if (lenteWithRounds) {
            resultTournaments.push(lenteWithRounds);
          }
        }
      }

      // Add is_sevilla_imported flag to rounds and tournament for frontend sorting
      return resultTournaments.map(tournament => ({
        ...tournament,
        is_sevilla_imported: tournament.rounds.some(round => round.type === 'REGULAR' && !round.label),
        rounds: tournament.rounds.map(round => ({
          ...round,
          is_sevilla_imported: round.type === 'REGULAR' && !round.label,
        }))
      }));
    }

    // For inactive or all tournaments, use normal filtering
    if (typeof active === 'boolean') {
      where.finished = !active;
    }
    if (typeof is_youth === 'boolean') {
      where.is_youth = is_youth;
    }

    const tournaments = await prisma.tournament.findMany({
      where,
      include: {
        participations: { include: { user: true } },
        rounds: { 
          include: { 
            games: { 
              select: {
                game_id: true,
                round_id: true,
                speler1_id: true,
                speler2_id: true,
                winnaar_id: true,
                result: true,
                uitgestelde_datum: true,
                board_position: true,
                original_game_id: true,
                speler1: true,
                speler2: true,
                winnaar: true,
              },
            } 
          } 
        },
      },
    });

    // Add is_sevilla_imported flag to rounds and tournament for frontend sorting
    return tournaments.map(tournament => ({
      ...tournament,
      is_sevilla_imported: tournament.rounds.some(round => round.type === 'REGULAR' && !round.label), // Check if any round is Sevilla imported
      rounds: tournament.rounds.map(round => ({
        ...round,
        is_sevilla_imported: round.type === 'REGULAR' && !round.label, // Sevilla rondes hebben geen label
      }))
    }));
  } catch (error) {
    throw handleDBError(error);
  }
};


export const getTournamentById = async (tournament_id: number): Promise<Tournament> => {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: {
        tournament_id,
      },
      include: {
        participations: {
          include: {
            user: true,
          },
        },
        rounds: {
          include: {
            games: {
              select: {
                game_id: true,
                round_id: true,
                speler1_id: true,
                speler2_id: true,
                winnaar_id: true,
                result: true,
                uitgestelde_datum: true,
                board_position: true,
                original_game_id: true,
                speler1: true,
                speler2: true,
                winnaar: true,
              },
            },
          },
        },
      },
    });

    if (!tournament) {
      throw ServiceError.notFound('No tournament with this id exists');
    }

    // Add is_sevilla_imported flag to rounds and tournament for frontend sorting
    const tournamentWithSevillaFlag = {
      ...tournament,
      is_sevilla_imported: tournament.rounds.some(round => round.type === 'REGULAR' && !round.label), // Check if any round is Sevilla imported
      rounds: tournament.rounds.map(round => ({
        ...round,
        is_sevilla_imported: round.type === 'REGULAR' && !round.label, // Sevilla rondes hebben geen label
      }))
    };

    console.log('🔍 Backend - Tournament is_youth:', tournamentWithSevillaFlag.is_youth, 'naam:', tournamentWithSevillaFlag.naam);
    console.log('🔍 Backend - Tournament rounds with Sevilla flags:', tournamentWithSevillaFlag.rounds.map(r => ({
      round_id: r.round_id,
      ronde_nummer: r.ronde_nummer,
      type: r.type,
      label: r.label,
      is_sevilla_imported: r.is_sevilla_imported
    })));

    return tournamentWithSevillaFlag;
  } catch (error) {
    throw handleDBError(error);
  }
};

export const addTournament = async (tournament: TournamentCreateInput) => {
  try {
    return await prisma.tournament.create({
      data: {
        naam: tournament.naam,
        rondes: tournament.rondes,
        type: tournament.type,  
        is_youth: tournament.is_youth,
        // Jeugdkampioenschappen gebruiken geen ELIO rating
        rating_enabled: tournament.is_youth ? false : tournament.rating_enabled,
        participations: {
          create: tournament.participations.map((userId: number) => ({ user: { connect: { user_id: userId } } })),
        },
      },
      include: {
        participations: {
          include: {
            user: true,
          },
        },
      },
    });
  } catch (error) {
    throw handleDBError(error);
  }
};

export const removeTournament = async (tournament_id: number): Promise<void> => {
  try {
    await prisma.$transaction(async (prisma) => {
      await prisma.participation.deleteMany({
        where: { tournament_id },
      });

      const rounds = await prisma.round.findMany({
        where: { tournament_id },
        select: { round_id: true },
      });

      for (const round of rounds) {
        await prisma.game.deleteMany({
          where: { round_id: round.round_id },
        });
      }

      await prisma.round.deleteMany({
        where: { tournament_id },
      });

      await prisma.tournament.delete({
        where: { tournament_id },
      });
    });
  } catch (error) {
    throw handleDBError(error);
  }
};

export const updateTournament = async (tournament_id: number, changes: TournamentUpdateInput) => {
  try {
    const { participations, ...restOfChanges } = changes;

    const updateData: any = {
      ...restOfChanges,
    };

    if (participations) {
      updateData.participations = {
        deleteMany: {},
        create: participations.map((userId: number) => ({ user: { connect: { user_id: userId } } })),
      };
    }

    return await prisma.tournament.update({
      where: {
        tournament_id,
      },
      data: updateData,
      include: {
        participations: {
          include: {
            user: true,
          },
        },
      },
    });
  } catch (error) {
    throw handleDBError(error);
  }
};

export const savePairings = async (tournament_id: number, round_number: number, pairings: any[]) => {
  try {
    const round = await prisma.round.create({
      data: {
        tournament_id,
        ronde_nummer: round_number,
        ronde_datum: new Date(),
      },
    });

    await prisma.game.createMany({
      data: pairings.map((pairing) => ({
        round_id: round.round_id,
        speler1_id: pairing.white.user_id,
        speler2_id: pairing.black.user_id,
      })),
    });
  } catch (error) {
    throw handleDBError(error);
  }
};

export const addParticipation = async (tournament_id: number, user_id: number): Promise<Participation> => {
  try {
    return await prisma.participation.create({
      data: {
        tournament: { connect: { tournament_id } },
        user: { connect: { user_id } },
        score: 0, 
        buchholz: 0, 
        sonnebornBerger: 0, 
        opponents: '', 
        color_history: '',
        bye_round: null,
      },
    });
  } catch (error) {
    throw handleDBError(error);
  }
};

export const removeParticipation = async (tournament_id: number, user_id: number): Promise<void> => {
  try {
    await prisma.participation.delete({
      where: {
        user_id_tournament_id: {
          user_id,
          tournament_id,
        },
      },
    });
  } catch (error) {
    throw handleDBError(error);
  }
};

export const finalizeTournamentRatings = async (
  tournament_id: number
): Promise<void> => {
  const K_FACTOR = 32;

  try {
    // 1) Haal alle deelnames met de bijbehorende user‐ratings
    const parts = await prisma.participation.findMany({
      where: { tournament_id },
      include: {
        user: {
          select: {
            user_id: true,
            schaakrating_elo: true,
            schaakrating_max: true,
          },
        },
      },
    });
    if (parts.length === 0) {
      throw ServiceError.validationFailed("Geen deelnemers voor dit toernooi");
    }

    // 2) Haal alle games van dit toernooi
    const games = await prisma.game.findMany({
      where: { round: { tournament_id } },
    });

    // 3) Init stats: oude rating, score=0, expected=0
    type Stats = { oldRating: number; score: number; expected: number };
    const stats: Record<number, Stats> = {};
    for (const p of parts) {
      stats[p.user_id] = {
        oldRating: p.user.schaakrating_elo,
        score: 0,
        expected: 0,
      };
    }

    // 4) Vul score & expected op basis van game.result
    for (const g of games) {
      const a = stats[g.speler1_id]!;
      // bye‐game?
      if (g.speler2_id == null) {
        if (g.winnaar_id === g.speler1_id) {
          a.score += 1;
        }
        continue;
      }
      const b = stats[g.speler2_id]!;

      // 4a) score toekennen
      switch (g.result) {
        case "1-0":
          a.score += 1;
          break;
        case "0-1":
          b.score += 1;
          break;
        case "1/2-1/2":
          a.score += 0.5;
          b.score += 0.5;
          break;
        default:
          break;
      }

      // 4b) expected-score volgens Elo-formule
      const ea = 1 / (1 + 10 ** ((b.oldRating - a.oldRating) / 400));
      const eb = 1 / (1 + 10 ** ((a.oldRating - b.oldRating) / 400));
      a.expected += ea;
      b.expected += eb;
    }

    // 5) Pas nieuwe ratings toe in één transaction
    await prisma.$transaction(
      parts.map((p) => {
        const userId = p.user_id;
        const s = stats[userId]!;              // non-null assert
        const { oldRating, score, expected } = s;

        const delta     = Math.round(K_FACTOR * (score - expected));
        const newRating = oldRating + delta;
        const newMax    = Math.max(p.user.schaakrating_max ?? oldRating, newRating);

        return prisma.user.update({
          where: { user_id: userId },
          data: {
            schaakrating_elo:        newRating,
            schaakrating_difference: delta,
            schaakrating_max:        newMax,
          },
        });
      })
    );
  } catch (error) {
    throw handleDBError(error);
  }
};

export const endTournament = async (tournament_id: number): Promise<void> => {
  const tour = await prisma.tournament.findUnique({
    where: { tournament_id },
    select: { rating_enabled: true, finished: true }
  });
  if (!tour) throw ServiceError.notFound("Toernooi niet gevonden");
  if (tour.finished) throw ServiceError.conflict("Toernooi al afgesloten");

  // 1) als rating_enabled: pas Elo toe
  if (tour.rating_enabled) {
    await finalizeTournamentRatings(tournament_id);
  }

  // 2) markeer als afgewerkt
  await prisma.tournament.update({
    where: { tournament_id },
    data: { finished: true },
  });
};