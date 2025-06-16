// src/service/rondeService.ts
import { prisma } from "../data";
import type { Ronde, RondeUpdateInput } from "../types/ronde";
import handleDBError from "./handleDBError";
import ServiceError from "../core/serviceError";

export const getAllRondes = async (): Promise<Ronde[]> => {
  try {
    return await prisma.round.findMany();
  } catch (error) {
    throw handleDBError(error);
  }
};

export const getAllRondesByTournamentId = async (
  tournamentId: number
): Promise<Ronde[]> => {
  try {
    return await prisma.round.findMany({
      where: { tournament_id: tournamentId },
      include: {
        games: {
          include: {
            speler1: true,
            speler2: true,
          },
        },
      },
    });
  } catch (error) {
    throw handleDBError(error);
  }
};

export const getById = async (roundId: number): Promise<Ronde> => {
  try {
    const ronde = await prisma.round.findUnique({
      where: { round_id: roundId },
    });
    if (!ronde) throw ServiceError.notFound("No round with this id exists");
    return ronde;
  } catch (error) {
    throw handleDBError(error);
  }
};

export const getRondeByTournamentId = async (
  tournamentId: number,
  roundId: number
): Promise<Ronde> => {
  try {
    const ronde = await prisma.round.findFirst({
      where: {
        tournament_id: tournamentId,
        round_id: roundId,
      },
    });
    if (!ronde)
      throw ServiceError.notFound(
        "No round with this id exists for the tournament"
      );
    return ronde;
  } catch (error) {
    throw handleDBError(error);
  }
};

export const createRonde = async (input: any)=> {
  try {
    return await prisma.round.create({
      data: {
        tournament_id:      input.tournament_id,
        ronde_nummer:       input.ronde_nummer,
        ronde_datum:        input.ronde_datum,
        calendar_event_id:  input.calendar_event_id ?? undefined,
      },
    });
  } catch (error) {
    throw handleDBError(error);
  }
};

export const updateRonde = async (
  tournament_id: number,
  round_id: number,
  changes: RondeUpdateInput
): Promise<Ronde> => {
  try {
    // controleer of de ronde bestaat
    const exists = await prisma.round.findFirst({
      where: { tournament_id, round_id },
    });
    if (!exists)
      throw ServiceError.notFound(
        `Ronde met id ${round_id} niet gevonden voor toernooi ${tournament_id}`
      );

    // update alle velden die in `changes` zijn meegegeven, incl. calendar_event_id
    return await prisma.round.update({
      where: { tournament_id, round_id },
      data: {
        ...(changes.ronde_nummer  !== undefined && { ronde_nummer:  changes.ronde_nummer  }),
        ...(changes.ronde_datum   !== undefined && { ronde_datum:    changes.ronde_datum   }),
        calendar_event_id: changes.calendar_event_id ?? null,
      },
    });
  } catch (error) {
    throw handleDBError(error);
  }
};

export const removeRound = async (
  tournament_id: number,
  round_id: number
): Promise<void> => {
  try {
    await prisma.round.delete({
      where: { tournament_id, round_id },
    });
  } catch (error) {
    throw handleDBError(error);
  }
};
