import { prisma } from "./data";
import type { Tournament, TournamentCreateInput, TournamentUpdateInput } from "../types/tournament";
import type { Participation } from "../types/participation";
import ServiceError from "../core/serviceError";
import handleDBError from "./handleDBError";

export const getAllTournaments = async (): Promise<Tournament[]> => {
  try {
    return await prisma.tournament.findMany({
      include: {
        participations: {
          include: {
            user: true,
          },
        },
        rounds: {
          include: {
            games: {
              include: {
                speler1: true,
                speler2: true,
                winnaar: true,
              },
            },
          },
        },
      },
    });
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
              include: {
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

    return tournament;
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