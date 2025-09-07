import { prisma } from "./data";
import { RoundType } from "../types/Types";
import ServiceError from "../core/serviceError";
import handleDBError from "./handleDBError";
import * as calendarService from "./calendarService";

export interface MakeupRound {
  round_id: number;
  tournament_id: number;
  ronde_nummer: number;
  ronde_datum: Date;
  startuur: string;
  type: RoundType;
  label?: string;
  calendar_event_id?: number;
}

/**
 * Maak een inhaaldag aan als een echte ronde
 */
export async function createMakeupRound(
  tournament_id: number,
  round_after: number,
  date: Date,
  startuur: string,
  label?: string
): Promise<MakeupRound> {
  try {
    // 1. Haal de toernooi op
    const tournament = await prisma.tournament.findUnique({
      where: { tournament_id },
      select: { naam: true, rounds: { orderBy: { ronde_nummer: 'asc' } } }
    });

    if (!tournament) {
      throw ServiceError.notFound(`Toernooi met ID ${tournament_id} niet gevonden`);
    }

    // 2. Bepaal het juiste ronde nummer
    // Zoek de laatste ronde die voor of op round_after komt
    const regularRounds = tournament.rounds.filter(r => r.type === 'REGULAR');
    const lastRegularRound = regularRounds.find(r => r.ronde_nummer === round_after);
    
    if (!lastRegularRound) {
      throw ServiceError.validationFailed(`Ronde ${round_after} niet gevonden in toernooi`);
    }

    // 3. Bepaal het volgende ronde nummer
    // Tel alle rondes (regulier + inhaaldagen) tot en met round_after
    const roundsUpToAfter = tournament.rounds.filter(r => r.ronde_nummer <= round_after);
    const nextRoundNumber = Math.max(...roundsUpToAfter.map(r => r.ronde_nummer)) + 1;

    // 4. Maak de inhaaldag ronde aan
    const makeupRound = await prisma.round.create({
      data: {
        tournament_id,
        ronde_nummer: nextRoundNumber,
        ronde_datum: date,
        startuur,
        type: RoundType.MAKEUP,
        label: label || `Inhaaldag na ronde ${round_after}`,
      },
    });

    // 5. Maak een calendar event aan
    const eventTitle = label 
      ? `${tournament.naam} - ${label}`
      : `${tournament.naam} - Inhaaldag na ronde ${round_after}`;
    
    const calendarEvent = await calendarService.createEvent({
      title: eventTitle,
      description: `Inhaaldag voor uitgestelde partijen`,
      type: "Inhaaldag",
      date: date,
      startuur: startuur,
      tournament_id: tournament_id,
    });

    // 6. Update de ronde met de calendar event ID
    const updatedRound = await prisma.round.update({
      where: { round_id: makeupRound.round_id },
      data: {
        calendar_event_id: calendarEvent.event_id,
      },
    });

    return updatedRound;
  } catch (error) {
    throw handleDBError(error);
  }
}

/**
 * Verwijder een inhaaldag ronde
 */
export async function deleteMakeupRound(round_id: number): Promise<void> {
  try {
    const round = await prisma.round.findUnique({
      where: { round_id },
      select: { type: true, calendar_event_id: true }
    });

    if (!round) {
      throw ServiceError.notFound(`Ronde met ID ${round_id} niet gevonden`);
    }

    if (round.type !== RoundType.MAKEUP) {
      throw ServiceError.validationFailed(`Ronde ${round_id} is geen inhaaldag`);
    }

    // Verwijder de calendar event als die bestaat
    if (round.calendar_event_id) {
      await calendarService.deleteEvent(round.calendar_event_id);
    }

    // Verwijder de ronde (games worden automatisch verwijderd door cascade)
    await prisma.round.delete({
      where: { round_id }
    });
  } catch (error) {
    throw handleDBError(error);
  }
}

/**
 * Update een inhaaldag ronde
 */
export async function updateMakeupRound(
  round_id: number,
  data: Partial<{
    ronde_datum: Date;
    startuur: string;
    label: string;
  }>
): Promise<MakeupRound> {
  try {
    const round = await prisma.round.findUnique({
      where: { round_id },
      select: { type: true, calendar_event_id: true }
    });

    if (!round) {
      throw ServiceError.notFound(`Ronde met ID ${round_id} niet gevonden`);
    }

    if (round.type !== RoundType.MAKEUP) {
      throw ServiceError.validationFailed(`Ronde ${round_id} is geen inhaaldag`);
    }

    // Update de ronde
    const updatedRound = await prisma.round.update({
      where: { round_id },
      data: {
        ronde_datum: data.ronde_datum,
        startuur: data.startuur,
        label: data.label,
      },
    });

    // Update de calendar event als die bestaat
    if (round.calendar_event_id && (data.ronde_datum || data.startuur || data.label)) {
      await calendarService.updateEvent(round.calendar_event_id, {
        date: data.ronde_datum,
        startuur: data.startuur,
        title: data.label ? `${updatedRound.label}` : undefined,
      });
    }

    return updatedRound;
  } catch (error) {
    throw handleDBError(error);
  }
}

/**
 * Haal alle inhaaldag rondes op voor een toernooi
 */
export async function getMakeupRoundsForTournament(tournament_id: number): Promise<MakeupRound[]> {
  try {
    const rounds = await prisma.round.findMany({
      where: {
        tournament_id,
        type: RoundType.MAKEUP
      },
      orderBy: { ronde_nummer: 'asc' }
    });

    return rounds;
  } catch (error) {
    throw handleDBError(error);
  }
}

/**
 * Haal alle rondes op voor een toernooi (regulier + inhaaldagen) in de juiste volgorde
 */
export async function getAllRoundsForTournament(tournament_id: number): Promise<MakeupRound[]> {
  try {
    const rounds = await prisma.round.findMany({
      where: { tournament_id },
      orderBy: { ronde_nummer: 'asc' }
    });

    return rounds;
  } catch (error) {
    throw handleDBError(error);
  }
}
