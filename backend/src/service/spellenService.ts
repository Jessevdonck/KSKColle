import { prisma } from "./data/";

export const getAllSpellen = () => {
  return prisma.game.findMany();
};
  
export const getSpelById = async (game_id: string) => {
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
  
export const getSpellenByTournamentId = (tournament_id: string) => {
  return prisma.game.findMany({
    where: {
      round: {
        tournament_id,
      },
    },
  });
};
  
export const addSpel = async ({ 
  round_id,
  speler1_id,
  speler2_id,
  winnaar_id,
  result,
  uitgestelde_datum}: any) => {

  return await prisma.game.create({
    data: {
      round_id,
      speler1_id,
      speler2_id,
      winnaar_id,
      result,
      uitgestelde_datum,
    },
  });
};
  
export const updateSpel = async (game_id: string, changes:any) => {

  return prisma.game.update({
    where: {
      game_id, 
    },
    data: changes,
  });
};

export const removeSpel = async (game_id: string) => {
  await prisma.game.delete({
    where: {
      game_id,
    },
  });
};