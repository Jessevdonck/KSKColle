import { prisma } from "./data/";
import type { Spel, SpelCreateInput, SpelUpdateInput } from "../types/spel";

export const getAllSpellen = (): Promise<Spel[]> => {
  return prisma.game.findMany();
};
  
export const getSpelById = async (game_id: string): Promise<Spel> => {
  const game = await prisma.game.findUnique({
    where: {
      game_id,
    },
  });

  if (!game) {
    throw new Error('No game with this id exists');
  }

  return game;
};

export const getSpellenByTournamentId = (tournament_id: string): Promise<Spel[]> => {
  return prisma.game.findMany({
    where: {
      round: {
        tournament_id,
      },
    },
  });
};
  
export const createSpel = async (spel: SpelCreateInput) => {

  return await prisma.game.create({
    data: spel,
  });
};
  
export const updateSpel = async (game_id: string, changes:SpelUpdateInput) => {

  return prisma.game.update({
    where: {
      game_id, 
    },
    data: changes,
  });
};

export const removeSpel = async (game_id: string): Promise<void> => {
  await prisma.game.delete({
    where: {
      game_id,
    },
  });
};