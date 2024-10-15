import { prisma } from "./data/";

export const getAllTournament = () => {
  return prisma.tournament.findMany();
};

export const getTournamentById = async (tournament_id: string) => {
  const tournament = await prisma.tournament.findUnique({
    where: {
      tournament_id,
    },
  });

  if (!tournament) {
    throw new Error('No tournament with this id exists');
  }

  return tournament;
};

export const addTournament = async ({ naam, rondes }: any) => {

  return await prisma.tournament.create({
    data: {
      naam,
      rondes,
    },
  });
};

export const removeTournament = async (tournament_id: string) => {
  await prisma.tournament.delete({
    where: {
      tournament_id,
    },
  });
};

export const updateTournament = async (tournament_id: string, changes:any) => {

  return prisma.tournament.update({
    where: {
      tournament_id, 
    },
    data: changes,
  });
};
  
