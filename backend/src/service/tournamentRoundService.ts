import { prisma } from "./data";
import { RoundType } from "../types/Types";
import ServiceError from "../core/serviceError";
import handleDBError from "./handleDBError";
import * as calendarService from "./calendarService";

export interface TournamentRound {
  round_id: number;
  tournament_id: number;
  ronde_nummer: number;
  ronde_datum: Date;
  startuur: string;
  type: RoundType;
  label: string | null;
  calendar_event_id: number | null;
  is_sevilla_imported: boolean; // Nieuwe veld om te onderscheiden
  games: any[];
}

/**
 * Haal alle rondes op voor een toernooi in de juiste volgorde
 * Dit combineert Sevilla rondes met admin-gemaakte inhaaldagen
 */
export async function getAllTournamentRounds(tournament_id: number): Promise<TournamentRound[]> {
  try {
    const rounds = await prisma.round.findMany({
      where: { tournament_id },
      include: {
        games: {
          include: {
            speler1: true,
            speler2: true,
            winnaar: true
          }
        }
      },
      orderBy: { ronde_nummer: 'asc' }
    });

    return rounds.map(round => ({
      ...round,
      is_sevilla_imported: round.type === 'REGULAR' && !round.label, // Sevilla rondes hebben geen label
      games: round.games
    }));
  } catch (error) {
    throw handleDBError(error);
  }
}

/**
 * Maak een inhaaldag ronde aan tussen bestaande rondes
 */
export async function createMakeupRoundBetween(
  tournament_id: number,
  after_round_number: number,
  date: Date,
  startuur: string,
  label?: string
): Promise<TournamentRound> {
  try {
    // 1. Haal alle bestaande rondes op
    const existingRounds = await prisma.round.findMany({
      where: { tournament_id },
      orderBy: { ronde_nummer: 'asc' }
    });

    // 2. Bepaal het juiste ronde nummer
    const correctRoundNumber = determineMakeupRoundNumber(existingRounds, after_round_number);

    // 3. Verschuif alle rondes na de inhaaldag
    await shiftRoundsAfter(tournament_id, correctRoundNumber);

    // 4. Bepaal het inhaaldag nummer
    const makeupDayNumber = getMakeupDayNumber(existingRounds);

    // 5. Maak de inhaaldag ronde aan
    const makeupRound = await prisma.round.create({
      data: {
        tournament_id,
        ronde_nummer: correctRoundNumber,
        ronde_datum: date,
        startuur,
        type: RoundType.MAKEUP,
        label: label || `Inhaaldag ${makeupDayNumber}`,
        is_sevilla_imported: false,
      },
    });

    // 5. Maak calendar event aan
    const tournament = await prisma.tournament.findUnique({
      where: { tournament_id },
      select: { naam: true }
    });

    if (tournament) {
      const eventTitle = `${tournament.naam} - Inhaaldag ${makeupDayNumber}`;
      
      const calendarEvent = await calendarService.createEvent({
        title: eventTitle,
        description: `Inhaaldag voor uitgestelde partijen`,
        type: "Inhaaldag",
        date: date,
        startuur: startuur,
        tournament_id: tournament_id,
      });

      // Update de ronde met calendar event ID
      await prisma.round.update({
        where: { round_id: makeupRound.round_id },
        data: { calendar_event_id: calendarEvent.event_id }
      });
    }

    return {
      ...makeupRound,
      is_sevilla_imported: false,
      games: []
    };
  } catch (error) {
    throw handleDBError(error);
  }
}

/**
 * Stel een game uit naar een inhaaldag (Admin versie)
 * Gebruikt dezelfde logica als de player postponement: markeer origineel als uitgesteld en maak nieuwe game aan
 */
export async function postponeGameToMakeupRound(
  game_id: number,
  makeup_round_id: number
): Promise<any> {
  try {
    // 1. Haal de originele game op
    const originalGame = await prisma.game.findUnique({
      where: { game_id },
      include: {
        speler1: true,
        speler2: true,
        round: {
          include: {
            tournament: true
          }
        }
      }
    });

    if (!originalGame) {
      throw ServiceError.notFound('Game niet gevonden');
    }

    // 2. Controleer of de game al gespeeld is
    if (originalGame.result) {
      throw ServiceError.validationFailed('Deze partij is al gespeeld en kan niet meer uitgesteld worden');
    }

    // 3. Controleer of de game al uitgesteld is
    if (originalGame.uitgestelde_datum) {
      throw ServiceError.validationFailed('Deze partij is al uitgesteld');
    }

    // 4. Controleer of de inhaaldag ronde bestaat
    const makeupRound = await prisma.round.findUnique({
      where: { round_id: makeup_round_id },
      select: { type: true, tournament_id: true }
    });

    if (!makeupRound || makeupRound.type !== RoundType.MAKEUP) {
      throw ServiceError.validationFailed(`Ronde ${makeup_round_id} is geen inhaaldag`);
    }

    // 5. Controleer of de inhaaldag bij hetzelfde toernooi hoort
    if (makeupRound.tournament_id !== originalGame.round.tournament_id) {
      throw ServiceError.validationFailed('Inhaaldag hoort niet bij hetzelfde toernooi');
    }

    // 6. Markeer de originele game als uitgesteld
    await prisma.game.update({
      where: { game_id },
      data: {
        result: 'uitgesteld',
        uitgestelde_datum: new Date()
      }
    });

    // 7. Maak een nieuwe game aan in de inhaaldag
    const newGame = await prisma.game.create({
      data: {
        round_id: makeup_round_id,
        speler1_id: originalGame.speler1_id,
        speler2_id: originalGame.speler2_id,
        winnaar_id: null,
        result: null, // Nieuwe game zonder resultaat
        uitgestelde_datum: null // Nieuwe game is niet uitgesteld
      },
      include: {
        speler1: true,
        speler2: true,
        round: true
      }
    });

    return {
      success: true,
      message: `Partij succesvol uitgesteld naar inhaaldag`,
      original_game_id: game_id,
      new_game_id: newGame.game_id,
      new_round_id: makeup_round_id
    };
  } catch (error) {
    throw handleDBError(error);
  }
}

/**
 * Maak een admin uitstel ongedaan (Admin versie)
 * Verwijdert de nieuwe game en herstelt de originele game
 */
export async function undoAdminPostponeGame(
  original_game_id: number,
  new_game_id: number
): Promise<any> {
  try {
    // 1. Verwijder de nieuwe game uit de inhaaldag
    await prisma.game.delete({
      where: { game_id: new_game_id }
    });

    // 2. Herstel de originele game naar "Nog te spelen" status
    const restoredGame = await prisma.game.update({
      where: { game_id: original_game_id },
      data: {
        result: null, // Reset naar "Nog te spelen"
        uitgestelde_datum: null // Reset uitgestelde datum
      },
      include: {
        speler1: true,
        speler2: true,
        round: true
      }
    });

    return {
      success: true,
      message: `Uitstel ongedaan gemaakt. Game is teruggeplaatst naar originele ronde`,
      original_game_id: original_game_id,
      restored_round_id: restoredGame.round_id
    };
  } catch (error) {
    throw handleDBError(error);
  }
}

/**
 * Voeg een game toe aan een inhaaldag ronde
 */
export async function addGameToMakeupRound(
  round_id: number,
  speler1_id: number,
  speler2_id: number | null,
  result?: string
): Promise<any> {
  try {
    // Controleer of het een inhaaldag ronde is
    const round = await prisma.round.findUnique({
      where: { round_id },
      select: { type: true }
    });

    if (!round || round.type !== RoundType.MAKEUP) {
      throw ServiceError.validationFailed(`Ronde ${round_id} is geen inhaaldag`);
    }

    // Maak de game aan
    const game = await prisma.game.create({
      data: {
        round_id,
        speler1_id,
        speler2_id,
        result: result || null,
        winnaar_id: result === '1-0' ? speler1_id : result === '0-1' ? speler2_id : null,
      },
    });

    return game;
  } catch (error) {
    throw handleDBError(error);
  }
}

/**
 * Update de datum van een inhaaldag ronde
 */
export async function updateMakeupRoundDate(
  round_id: number,
  new_date: Date,
  new_startuur?: string
): Promise<TournamentRound> {
  try {
    const round = await prisma.round.findUnique({
      where: { round_id },
      select: { type: true, calendar_event_id: true }
    });

    if (!round || round.type !== RoundType.MAKEUP) {
      throw ServiceError.validationFailed(`Ronde ${round_id} is geen inhaaldag`);
    }

    // Update de ronde
    const updateData: any = {
      ronde_datum: new_date,
    };
    if (new_startuur !== undefined) {
      updateData.startuur = new_startuur;
    }
    
    const updatedRound = await prisma.round.update({
      where: { round_id },
      data: updateData,
      include: {
        games: {
          include: {
            speler1: true,
            speler2: true,
            winnaar: true
          }
        }
      }
    });

    // Update calendar event
    if (round.calendar_event_id) {
      const eventUpdateData: any = {
        date: new_date,
        title: `Inhaaldag - ${updatedRound.label || `Na ronde ${updatedRound.ronde_nummer - 1}`}`,
      };
      if (new_startuur !== undefined) {
        eventUpdateData.startuur = new_startuur;
      } else {
        eventUpdateData.startuur = updatedRound.startuur;
      }
      
      await calendarService.updateEvent(round.calendar_event_id, eventUpdateData);
    }

    return {
      ...updatedRound,
      is_sevilla_imported: false,
      games: updatedRound.games || []
    };
  } catch (error) {
    throw handleDBError(error);
  }
}

/**
 * Verwijder een inhaaldag ronde en verschuif andere rondes terug
 */
export async function deleteMakeupRound(round_id: number): Promise<void> {
  try {
    const round = await prisma.round.findUnique({
      where: { round_id },
      select: { type: true, tournament_id: true, ronde_nummer: true, calendar_event_id: true }
    });

    if (!round || round.type !== RoundType.MAKEUP) {
      throw ServiceError.validationFailed(`Ronde ${round_id} is geen inhaaldag`);
    }

    // Verwijder calendar event
    if (round.calendar_event_id) {
      await calendarService.deleteEvent(round.calendar_event_id);
    }

    // Verwijder de ronde (games worden automatisch verwijderd)
    await prisma.round.delete({
      where: { round_id }
    });

    // Verschuif alle rondes na deze ronde terug
    await shiftRoundsBack(round.tournament_id, round.ronde_nummer);
  } catch (error) {
    throw handleDBError(error);
  }
}

/**
 * Bepaal het juiste ronde nummer voor een inhaaldag
 */
function determineMakeupRoundNumber(existingRounds: any[], after_round_number: number): number {
  // Zoek de laatste ronde die voor of op after_round_number komt
  const roundsUpToAfter = existingRounds.filter(r => r.ronde_nummer <= after_round_number);
  
  if (roundsUpToAfter.length === 0) {
    return after_round_number + 1;
  }

  const lastRoundNumber = Math.max(...roundsUpToAfter.map(r => r.ronde_nummer));
  return lastRoundNumber + 1;
}

/**
 * Bepaal het inhaaldag nummer (1, 2, 3, etc.)
 */
function getMakeupDayNumber(existingRounds: any[]): number {
  // Tel alle bestaande inhaaldagen
  const existingMakeupDays = existingRounds.filter(r => r.type === 'MAKEUP');
  return existingMakeupDays.length + 1;
}

/**
 * Verschuif alle rondes na een bepaald nummer naar rechts
 */
async function shiftRoundsAfter(tournament_id: number, from_round_number: number): Promise<void> {
  const roundsToShift = await prisma.round.findMany({
    where: {
      tournament_id,
      ronde_nummer: { gte: from_round_number }
    },
    orderBy: { ronde_nummer: 'desc' } // Van hoog naar laag om conflicten te vermijden
  });

  for (const round of roundsToShift) {
    await prisma.round.update({
      where: { round_id: round.round_id },
      data: { ronde_nummer: round.ronde_nummer + 1 }
    });
  }
}

/**
 * Verschuif alle rondes na een bepaald nummer naar links
 */
async function shiftRoundsBack(tournament_id: number, from_round_number: number): Promise<void> {
  const roundsToShift = await prisma.round.findMany({
    where: {
      tournament_id,
      ronde_nummer: { gt: from_round_number }
    },
    orderBy: { ronde_nummer: 'asc' } // Van laag naar hoog
  });

  for (const round of roundsToShift) {
    await prisma.round.update({
      where: { round_id: round.round_id },
      data: { ronde_nummer: round.ronde_nummer - 1 }
    });
  }
}
