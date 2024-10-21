import { prisma } from "./data/";
import type { Spel, SpelCreateInput, SpelUpdateInput, GameWithRoundAndTournament } from "../types/spel";

export const getAllSpellen = (): Promise<Spel[]> => {
  return prisma.game.findMany({
    include: {
      round: {
        include: {
          tournament: true,
        },
      },
      speler1: true,
      speler2: true,
    },
  });
};
  
export const getSpelById = async (game_id: number): Promise<Spel> => {
  const game = await prisma.game.findUnique({
    where: {
      game_id,
    },
    include: {
      round: {
        include: {
          tournament: true,
        },
      },
      speler1: true,
      speler2: true,
    },
  });

  if (!game) {
    throw new Error('No game with this id exists');
  }

  return game;
};

export const getSpellenByPlayerId = async (playerId: number): Promise<GameWithRoundAndTournament[]> => {
  const games = await prisma.game.findMany({
    where: {
      OR: [
        { speler1_id: playerId },  
        { speler2_id: playerId },  
      ],
    },
    include: {
      round: {
        include: {
          tournament: true,
        },
      },
      speler1: true,
      speler2: true,
    },
  });

  return games.map((game) => ({
    ...game,
    speler1_naam: `${game.speler1.voornaam} ${game.speler1.achternaam}`,
    speler2_naam: `${game.speler2.voornaam} ${game.speler2.achternaam}`,
    uitgestelde_datum: game.uitgestelde_datum?.toISOString(),
    round: {
      ...game.round,
      ronde_datum: game.round.ronde_datum.toISOString(),
    },
    winnaar_id: game.winnaar_id ?? null,
  }));
};

export const getSpellenByTournamentId = (tournament_id: number): Promise<Spel[]> => {
  return prisma.game.findMany({
    where: {
      round: {
        tournament_id,
      },
    },
    include: {
      round: {
        include: {
          tournament: true,
        },
      },
      speler1: true,
      speler2: true,
    },
  });
};
  
export const createSpel = async (spel: SpelCreateInput) => {
  return await prisma.game.create({
    data: spel,
    include: {
      round: {
        include: {
          tournament: true,
        },
      },
      speler1: true,
      speler2: true,
    },
  });
};
  
export const updateSpel = async (game_id: number, changes: SpelUpdateInput) => {
  return prisma.game.update({
    where: {
      game_id, 
    },
    data: changes,
    include: {
      round: {
        include: {
          tournament: true,
        },
      },
      speler1: true,
      speler2: true,
    },
  });
};

export const removeSpel = async (game_id: number): Promise<void> => {
  await prisma.game.delete({
    where: {
      game_id,
    },
  });
};