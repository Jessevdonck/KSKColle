import { prisma } from './data'
import type { MakeupDay } from '../types/Types'
import handleDBError from './handleDBError'
import * as calendarService from './calendarService'

export async function getMakeupDaysForTournament(tournament_id: number): Promise<MakeupDay[]> {
  return prisma.makeupDay.findMany({
    where: { tournament_id },
    orderBy: { round_after: 'asc' },
  });
}

export async function addMakeupDay(
  tournament_id: number,
  round_after: number,
  date: Date,
  startuur: string,
  label?: string
): Promise<MakeupDay> {
  try {
    // 1. Haal de toernooi naam op
    const tournament = await prisma.tournament.findUnique({
      where: { tournament_id },
      select: { naam: true }
    })

    if (!tournament) {
      throw new Error(`Tournament with ID ${tournament_id} not found`)
    }

    // 2. Bepaal het inhaaldag nummer
    const existingMakeupDays = await prisma.makeupDay.findMany({
      where: { tournament_id },
      orderBy: { id: 'asc' }
    })
    const makeupDayNumber = existingMakeupDays.length + 1

    // 3. Maak de makeup day aan
    const makeupDay = await prisma.makeupDay.create({
      data: {
        tournament_id,
        round_after,
        date,
        startuur,
        label: `Inhaaldag ${makeupDayNumber}`,
      },
    })

    // 4. Maak automatisch een calendar event aan met toernooi naam + label
    const eventTitle = `${tournament.naam} - Inhaaldag ${makeupDayNumber}`
    
    const calendarEvent = await calendarService.createEvent({
      title: eventTitle,
      description: `Inhaaldag voor uitgestelde partijen`,
      type: "Inhaaldag",
      date: date,
      startuur: startuur,
      tournament_id: tournament_id,
    })

    // 5. Update de makeup day met de calendar event ID
    const updatedMakeupDay = await prisma.makeupDay.update({
      where: { id: makeupDay.id },
      data: {
        calendar_event_id: calendarEvent.event_id,
      },
    })

    return updatedMakeupDay
  } catch (e) {
    throw handleDBError(e)
  }
}

export async function updateMakeupDay(
  id: number,
  data: Partial<{
    date: Date
    startuur: string
    label: string
    calendar_event_id: number
  }>
): Promise<MakeupDay> {
  try {
    return await prisma.makeupDay.update({
      where: { id },
      data,
    })
  } catch (e) {
    throw handleDBError(e)
  }
}

export async function removeMakeupDay(id: number): Promise<void> {
  try {
    await prisma.makeupDay.delete({ where: { id } })
  } catch (e) {
    throw handleDBError(e)
  }
}
