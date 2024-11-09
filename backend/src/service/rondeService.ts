import { prisma } from '../data';
import type { Ronde, RondeCreateInput, RondeUpdateInput } from '../types/ronde';
import handleDBError from './handleDBError';
import ServiceError from "../core/serviceError";

export const getAllRondes = async (): Promise<Ronde[]> => {
  try {
    return await prisma.round.findMany();
  } catch (error) {
    throw handleDBError(error);
  }
};
  
export const getAllRondesByTournamentId = async (tournamentId: number): Promise<Ronde[]> => {
  try {
    return await prisma.round.findMany({
      where: {
        tournament_id: tournamentId, 
      },
      include: {
        games: {
          include: {
            speler1: true,
            speler2: true,
          }
        }
      }
    });
  } catch (error) {
    throw handleDBError(error);
  }
};
  
export const getRondeByTournamentId = async (tournamentId: number, roundId: number): Promise<Ronde> => {
  try {
    const ronde = await prisma.round.findFirst({
      where: {
        tournament_id: tournamentId,
        round_id: roundId,
      },
    });

    if (!ronde) {
      throw ServiceError.notFound(`Ronde met ID ${roundId} voor toernooi ${tournamentId} niet gevonden.`);
    }

    return ronde;
  } catch (error) {
    throw handleDBError(error);
  }
};
    
export const createRonde = async (ronde: RondeCreateInput): Promise<Ronde> => {
  try {
    return await prisma.round.create({
      data: ronde,
    });
  } catch (error) {
    throw handleDBError(error);
  }
};

export const updateRonde = async (tournament_id: number, round_id: number, changes: RondeUpdateInput): Promise<Ronde> => {
  try {
    // Controleer of de ronde bestaat voordat je gaat updaten
    const rondeExists = await prisma.round.findFirst({
      where: {
        tournament_id,
        round_id,
      },
    });

    if (!rondeExists) {
      throw ServiceError.notFound(`Ronde met ID ${round_id} voor toernooi ${tournament_id} niet gevonden.`);
    }

    return await prisma.round.update({
      where: {
        tournament_id,
        round_id, 
      },
      data: changes,
    });
  } catch (error) {
    throw handleDBError(error);
  }
};

export const removeRound = async (tournament_id: number, round_id: number): Promise<void> => {
  try {
    const rondeExists = await prisma.round.findFirst({
      where: {
        tournament_id,
        round_id,
      },
    });

    if (!rondeExists) {
      throw ServiceError.notFound(`Ronde met ID ${round_id} voor toernooi ${tournament_id} niet gevonden.`);
    }

    await prisma.round.delete({
      where: {
        tournament_id,
        round_id,
      },
    });
  } catch (error) {
    throw handleDBError(error);
  }
};
