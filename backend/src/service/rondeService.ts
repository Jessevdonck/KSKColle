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
      orderBy: [
        { ronde_datum: 'asc' }, // Sorteer eerst op datum
        { ronde_nummer: 'asc' }  // Dan op ronde nummer als fallback
      ]
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
    // Als ronde_nummer niet is opgegeven, bereken het volgende beschikbare nummer
    let ronde_nummer = input.ronde_nummer;
    if (!ronde_nummer) {
      ronde_nummer = await getNextRegularRoundNumber(input.tournament_id);
    }
    
    return await prisma.round.create({
      data: {
        tournament_id:      input.tournament_id,
        ronde_nummer:       ronde_nummer,
        ronde_datum:        input.ronde_datum,
        startuur:           input.startuur ?? "20:00",
        calendar_event_id:  input.calendar_event_id ?? undefined,
      },
    });
  } catch (error) {
    throw handleDBError(error);
  }
};

/**
 * Bepaal het volgende beschikbare reguliere ronde nummer
 * Dit houdt rekening met inhaaldagen die offset van 1000 gebruiken
 */
export const getNextRegularRoundNumber = async (tournament_id: number): Promise<number> => {
  try {
    // Haal alle reguliere rondes op (niet inhaaldagen)
    const regularRounds = await prisma.round.findMany({
      where: { 
        tournament_id,
        type: 'REGULAR' // Alleen reguliere rondes, geen inhaaldagen
      },
      orderBy: { ronde_nummer: 'desc' },
      take: 1
    });
    
    if (regularRounds.length === 0) {
      return 1; // Eerste ronde
    }
    
    const lastRound = regularRounds[0];
    if (!lastRound) {
      return 1; // Fallback
    }
    
    return lastRound.ronde_nummer + 1;
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
        ...(changes.startuur      !== undefined && { startuur:       changes.startuur      }),
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

export const getRoundForExport = async (
  tournamentId: number,
  roundId: number
): Promise<any> => {
  try {
    const round = await prisma.round.findFirst({
      where: {
        tournament_id: tournamentId,
        round_id: roundId,
      },
      include: {
        tournament: {
          select: {
            naam: true,
            type: true,
            is_youth: true,
          },
        },
        games: {
          include: {
            speler1: {
              select: {
                user_id: true,
                voornaam: true,
                achternaam: true,
                schaakrating_elo: true,
              },
            },
            speler2: {
              select: {
                user_id: true,
                voornaam: true,
                achternaam: true,
                schaakrating_elo: true,
              },
            },
            winnaar: {
              select: {
                user_id: true,
                voornaam: true,
                achternaam: true,
              },
            },
          },
        },
      },
    });

    if (!round) {
      throw ServiceError.notFound("Round not found");
    }

    return {
      round: {
        round_id: round.round_id,
        ronde_nummer: round.ronde_nummer,
        ronde_datum: round.ronde_datum,
        startuur: round.startuur,
        type: round.type,
        label: round.label,
      },
      tournament: round.tournament,
      games: round.games.map(game => ({
        game_id: game.game_id,
        speler1: game.speler1,
        speler2: game.speler2,
        winnaar: game.winnaar,
        result: game.result,
        uitgestelde_datum: game.uitgestelde_datum,
        board_position: game.board_position,
      })),
    };
  } catch (error) {
    throw handleDBError(error);
  }
};
