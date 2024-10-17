import { prisma } from "./data/";
import type { Toernooi, ToernooiCreateInput, ToernooiUpdateInput } from "../types/toernooi";

export const getAllTournament = (): Promise<Toernooi[]> => {
  return prisma.tournament.findMany();
};

export const getTournamentById = async (tournament_id: string): Promise<Toernooi> => {
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

export const addTournament = async (toernooi: ToernooiCreateInput) => {

  return await prisma.tournament.create({
    data: toernooi,
  });
};

export const removeTournament = async (tournament_id: string): Promise<void> => {
  await prisma.tournament.delete({
    where: {
      tournament_id,
    },
  });
};

export const updateTournament = async (tournament_id: string, changes:ToernooiUpdateInput) => {

  return prisma.tournament.update({
    where: {
      tournament_id, 
    },
    data: changes,
  });
};
  
