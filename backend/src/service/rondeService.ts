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

/**
 * Get the next upcoming round date across all classes of a tournament
 * Returns the earliest date >= today, or null if no upcoming rounds
 */
export const getNextRoundDate = async (
  tournamentId: number
): Promise<Date | null> => {
  try {
    // First, get the tournament to find its name
    const tournament = await prisma.tournament.findUnique({
      where: { tournament_id: tournamentId },
      select: { naam: true }
    });

    if (!tournament) {
      throw ServiceError.notFound("Tournament not found");
    }

    // Find all tournaments with the same name (all classes)
    const allClassesTournaments = await prisma.tournament.findMany({
      where: {
        naam: tournament.naam,
        finished: false
      },
      select: {
        tournament_id: true
      }
    });

    // Get all rounds from all classes, ordered by date
    const rounds = await prisma.round.findMany({
      where: {
        tournament_id: { in: allClassesTournaments.map(t => t.tournament_id) }
      },
      select: {
        ronde_datum: true
      },
      orderBy: {
        ronde_datum: 'asc'
      }
    });

    // Find the first round date >= today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const round of rounds) {
      const roundDate = new Date(round.ronde_datum);
      roundDate.setHours(0, 0, 0, 0);
      
      if (roundDate >= today) {
        return roundDate;
      }
    }

    // If no upcoming round, return the last round date
    if (rounds.length > 0) {
      const lastRound = rounds[rounds.length - 1];
      if (lastRound) {
        const lastRoundDate = new Date(lastRound.ronde_datum);
        lastRoundDate.setHours(0, 0, 0, 0);
        return lastRoundDate;
      }
    }

    return null;
  } catch (error) {
    throw handleDBError(error);
  }
};

/**
 * Get the next upcoming rounds with games across all classes of a tournament
 * Returns all rounds for the earliest upcoming date (>= today)
 */
export const getNextRoundsForExport = async (
  tournamentId: number
): Promise<any> => {
  try {
    // First, get the tournament to find its name
    const tournament = await prisma.tournament.findUnique({
      where: { tournament_id: tournamentId },
      select: { naam: true }
    });

    if (!tournament) {
      throw ServiceError.notFound("Tournament not found");
    }

    // Find all tournaments with the same name (all classes)
    const allClassesTournaments = await prisma.tournament.findMany({
      where: {
        naam: tournament.naam,
        finished: false
      },
      select: {
        tournament_id: true,
        class_name: true
      }
    });

    // Get all rounds from all classes, ordered by date
    const allRounds = await prisma.round.findMany({
      where: {
        tournament_id: { in: allClassesTournaments.map(t => t.tournament_id) }
      },
      include: {
        tournament: {
          select: {
            tournament_id: true,
            naam: true,
            class_name: true,
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
      orderBy: {
        ronde_datum: 'asc'
      }
    });

    // Find the first upcoming round date (>= today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let nextRoundDate: Date | null = null;

    for (const round of allRounds) {
      const roundDate = new Date(round.ronde_datum);
      roundDate.setHours(0, 0, 0, 0);
      
      if (roundDate >= today) {
        nextRoundDate = roundDate;
        break;
      }
    }

    // If no upcoming round, use the last round date
    if (!nextRoundDate && allRounds.length > 0) {
      const lastRound = allRounds[allRounds.length - 1];
      if (lastRound) {
        nextRoundDate = new Date(lastRound.ronde_datum);
        nextRoundDate.setHours(0, 0, 0, 0);
      }
    }

    if (!nextRoundDate) {
      return {
        tournamentName: tournament.naam,
        date: null,
        rounds: []
      };
    }

    // Filter rounds for the next round date
    const nextRoundDateStart = new Date(nextRoundDate);
    nextRoundDateStart.setHours(0, 0, 0, 0);
    const nextRoundDateEnd = new Date(nextRoundDate);
    nextRoundDateEnd.setHours(23, 59, 59, 999);

    const roundsForDate = allRounds.filter(round => {
      const roundDate = new Date(round.ronde_datum);
      return roundDate >= nextRoundDateStart && roundDate <= nextRoundDateEnd;
    });

    // Custom sort order for class names
    const classOrder = [
      'Eerste Klasse',
      'Tweede Klasse',
      'Derde Klasse',
      'Vierde Klasse',
      'Vijfde Klasse',
      'Vierde en Vijfde Klasse',
      'Zesde Klasse',
      'Zevende Klasse',
      'Achtste Klasse',
      'Hoofdtoernooi'
    ];

    // Sort rounds by class order
    const sortedRounds = roundsForDate.sort((a, b) => {
      const aClass = a.tournament.class_name || 'Hoofdtoernooi';
      const bClass = b.tournament.class_name || 'Hoofdtoernooi';
      const aIndex = classOrder.indexOf(aClass);
      const bIndex = classOrder.indexOf(bClass);
      
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return aClass.localeCompare(bClass);
    });

    return {
      tournamentName: tournament.naam,
      date: nextRoundDate,
      rounds: sortedRounds.map(round => ({
        round: {
          round_id: round.round_id,
          ronde_nummer: round.ronde_nummer,
          ronde_datum: round.ronde_datum,
          startuur: round.startuur,
          type: round.type,
          label: round.label,
        },
        tournament: {
          tournament_id: round.tournament.tournament_id,
          naam: round.tournament.naam,
          class_name: round.tournament.class_name,
          type: round.tournament.type,
          is_youth: round.tournament.is_youth,
        },
        games: round.games.map(game => ({
          game_id: game.game_id,
          speler1: game.speler1,
          speler2: game.speler2,
          winnaar: game.winnaar,
          result: game.result,
          uitgestelde_datum: game.uitgestelde_datum,
          board_position: game.board_position,
        })),
      })),
    };
  } catch (error) {
    throw handleDBError(error);
  }
};

/**
 * Get all rounds for a specific date across all classes of a tournament
 * (all tournaments with the same naam)
 */
export const getRoundsByDateForExport = async (
  tournamentId: number,
  date: Date
): Promise<any> => {
  try {
    // First, get the tournament to find its name
    const tournament = await prisma.tournament.findUnique({
      where: { tournament_id: tournamentId },
      select: { naam: true }
    });

    if (!tournament) {
      throw ServiceError.notFound("Tournament not found");
    }

    // Find all tournaments with the same name (all classes)
    const allClassesTournaments = await prisma.tournament.findMany({
      where: {
        naam: tournament.naam,
        finished: false
      },
      select: {
        tournament_id: true,
        class_name: true
      }
    });

    // Normalize the date to compare only the date part (ignore time)
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    // Get all rounds for this date from all classes
    const rounds = await prisma.round.findMany({
      where: {
        tournament_id: { in: allClassesTournaments.map(t => t.tournament_id) },
        ronde_datum: {
          gte: dateStart,
          lte: dateEnd
        }
      },
      include: {
        tournament: {
          select: {
            tournament_id: true,
            naam: true,
            class_name: true,
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
      orderBy: [
        { tournament: { class_name: 'asc' } },
        { ronde_nummer: 'asc' }
      ]
    });

    // Custom sort order for class names
    const classOrder = [
      'Eerste Klasse',
      'Tweede Klasse',
      'Derde Klasse',
      'Vierde Klasse',
      'Vijfde Klasse',
      'Vierde en Vijfde Klasse',
      'Zesde Klasse',
      'Zevende Klasse',
      'Achtste Klasse',
      'Hoofdtoernooi'
    ];

    // Sort rounds by class order
    const sortedRounds = rounds.sort((a, b) => {
      const aClass = a.tournament.class_name || 'Hoofdtoernooi';
      const bClass = b.tournament.class_name || 'Hoofdtoernooi';
      const aIndex = classOrder.indexOf(aClass);
      const bIndex = classOrder.indexOf(bClass);
      
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return aClass.localeCompare(bClass);
    });

    return {
      tournamentName: tournament.naam,
      date: dateStart,
      rounds: sortedRounds.map(round => ({
        round: {
          round_id: round.round_id,
          ronde_nummer: round.ronde_nummer,
          ronde_datum: round.ronde_datum,
          startuur: round.startuur,
          type: round.type,
          label: round.label,
        },
        tournament: {
          tournament_id: round.tournament.tournament_id,
          naam: round.tournament.naam,
          class_name: round.tournament.class_name,
          type: round.tournament.type,
          is_youth: round.tournament.is_youth,
        },
        games: round.games.map(game => ({
          game_id: game.game_id,
          speler1: game.speler1,
          speler2: game.speler2,
          winnaar: game.winnaar,
          result: game.result,
          uitgestelde_datum: game.uitgestelde_datum,
          board_position: game.board_position,
        })),
      })),
    };
  } catch (error) {
    throw handleDBError(error);
  }
};