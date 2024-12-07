import { prisma } from "./data/";
import type { Spel, SpelCreateInput, SpelUpdateInput, GameWithRoundAndTournament } from "../types/spel";
import ServiceError from "../core/serviceError";
import handleDBError from "./handleDBError";

export const getAllSpellen = async (): Promise<Spel[]> => {
  try {
    return await prisma.game.findMany({
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
  } catch (error) {
    throw handleDBError(error);
  }
};

export const getSpelById = async (game_id: number): Promise<Spel> => {
  try {
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
      throw ServiceError.notFound('No game with this id exists');
    }

    return game;
  } catch (error) {
    throw handleDBError(error);
  }
};

export const getSpellenByPlayerId = async (playerId: number): Promise<GameWithRoundAndTournament[]> => {
  try {
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

    return games.map((game): GameWithRoundAndTournament => ({
      game_id: game.game_id,
      round_id: game.round_id,
      speler1_id: game.speler1_id,
      speler2_id: game.speler2_id,
      winnaar_id: game.winnaar_id,
      result: game.result,
      uitgestelde_datum: game.uitgestelde_datum,
      speler1_naam: `${game.speler1.voornaam} ${game.speler1.achternaam}`,
      speler2_naam: game.speler2 ? `${game.speler2.voornaam} ${game.speler2.achternaam}` : null,
      round: {
        round_id: game.round.round_id,
        tournament_id: game.round.tournament_id,
        ronde_nummer: game.round.ronde_nummer,
        ronde_datum: game.round.ronde_datum,
        tournament: {
          tournament_id: game.round.tournament.tournament_id,
          naam: game.round.tournament.naam,
          rondes: game.round.tournament.rondes,
        },
      },
    }));
  } catch (error) {
    throw handleDBError(error);
  }
};

export const getSpellenByTournamentId = async (tournament_id: number): Promise<Spel[]> => {
  try {
    return await prisma.game.findMany({
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
  } catch (error) {
    throw handleDBError(error);
  }
};

export const createSpel = async (spel: SpelCreateInput) => {
  try {
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
  } catch (error) {
    throw handleDBError(error);
  }
};

export const updateSpel = async (game_id: number, data: SpelUpdateInput): Promise<Spel> => {
  try {
    const updatedGame = await prisma.game.update({
      where: {
        game_id,
      },
      data,
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
    console.log('Updated game:', updatedGame);
    return updatedGame;
  } catch (error) {
    throw handleDBError(error);
  }
};

export const removeSpel = async (game_id: number): Promise<void> => {
  try {
    await prisma.game.delete({
      where: {
        game_id,
      },
    });
  } catch (error) {
    throw handleDBError(error);
  }
};