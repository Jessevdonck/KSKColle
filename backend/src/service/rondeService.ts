import { prisma } from "./data/";

export const getAllRondes = () => {
  return prisma.round.findMany();
};
  
export const getAllRondesByTournamentId = async (tournamentId: string) => {
  return await prisma.round.findMany({
    where: {
      tournament_id: tournamentId, 
    },
  });
};
  
export const getRondeByTournamentId = async (tournamentId: string, roundId: number) => {
  return await prisma.round.findFirst({
    where: {
      tournament_id: tournamentId,
      round_id: roundId, 
    },
  });
};
    
export const createRonde = async ({ tournament_id, ronde_nummer, ronde_datum }: any) => {

  return await prisma.round.create({
    data: {
      tournament_id,
      ronde_nummer,
      ronde_datum,
    },
  });
};

export const updateRonde = async (tournament_id: string, round_id: number, changes: any) => {
  return await prisma.round.update({
    where: {
      tournament_id,
      round_id, 
    },
    data: 
      changes,
  });
};

export const removeRound = async (tournament_id: string, round_id: number) => {
  await prisma.round.delete({
    where: {
      tournament_id,
      round_id,
    },
  });
};