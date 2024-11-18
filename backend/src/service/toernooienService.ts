import { prisma } from "./data/";
import type { Toernooi, ToernooiCreateInput, ToernooiUpdateInput } from "../types/toernooi";
import type { Participation } from "../types/participation";

export const getAllTournaments = async (): Promise<Toernooi[]> => {
  return prisma.tournament.findMany({
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
};

export const getTournamentById = async (tournament_id: number): Promise<Toernooi> => {
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
    throw new Error('No tournament with this id exists');
  }

  return tournament;
};

export const addTournament = async (toernooi: ToernooiCreateInput) => {
  return await prisma.tournament.create({
    data: {
      naam: toernooi.naam,
      rondes: toernooi.rondes,
      participations: {
        create: toernooi.participations.map((userId: number) => ({ user: { connect: { user_id: userId } } })),
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
    console.error('Error deleting tournament:', error);
    throw error;
  }
};

export const updateTournament = async (tournament_id: number, changes: ToernooiUpdateInput) => {
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

  return prisma.tournament.update({
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
};

export const savePairings = async (tournament_id: number, round_number: number, pairings: any[]) => {
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
};

export const addParticipation = async (tournament_id: number, user_id: number): Promise<Participation> => {
  return prisma.participation.create({
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
};

export const removeParticipation = async (tournament_id: number, user_id: number): Promise<void> => {
  await prisma.participation.delete({
    where: {
      user_id_tournament_id: {
        user_id,
        tournament_id,
      },
    },
  });
};