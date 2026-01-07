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
  startuur: string
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

    // Check of dit een Lentecompetitie is
    const isLentecompetitie = tournament.naam.toLowerCase().includes('lentecompetitie')

    // 2. Bepaal het inhaaldag nummer
    const existingMakeupDays = await prisma.makeupDay.findMany({
      where: { tournament_id },
      orderBy: { id: 'asc' }
    })
    const makeupDayNumber = existingMakeupDays.length + 1

    // 3. Maak de makeup day aan voor het originele toernooi
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

    // 6. Als dit een Lentecompetitie is, maak dezelfde inhaaldag aan voor alle andere klassen
    if (isLentecompetitie) {
      const allTournaments = await prisma.tournament.findMany({
        where: { 
          naam: tournament.naam,
          tournament_id: { not: tournament_id } // Exclude het originele toernooi
        },
        select: { tournament_id: true }
      })

      // Maak voor elk ander toernooi dezelfde inhaaldag aan
      for (const otherTournament of allTournaments) {
        // Bepaal het inhaaldag nummer voor dit toernooi
        const otherExistingMakeupDays = await prisma.makeupDay.findMany({
          where: { tournament_id: otherTournament.tournament_id },
          orderBy: { id: 'asc' }
        })
        const otherMakeupDayNumber = otherExistingMakeupDays.length + 1

        // Maak de inhaaldag aan met hetzelfde calendar_event_id (delen hetzelfde event)
        await prisma.makeupDay.create({
          data: {
            tournament_id: otherTournament.tournament_id,
            round_after,
            date,
            startuur,
            label: `Inhaaldag ${otherMakeupDayNumber}`,
            calendar_event_id: calendarEvent.event_id, // Deel hetzelfde calendar event
          },
        })

        // Geen extra calendar event aanmaken - we delen hetzelfde event
      }
    }

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
    // 1. Haal de huidige makeup day op
    const makeupDay = await prisma.makeupDay.findUnique({
      where: { id },
      include: {
        tournament: {
          select: { naam: true }
        }
      }
    })

    if (!makeupDay) {
      throw new Error(`MakeupDay with ID ${id} not found`)
    }

    // 2. Update de makeup day
    const updatedMakeupDay = await prisma.makeupDay.update({
      where: { id },
      data,
    })

    // 3. Check of dit een Lentecompetitie is
    const isLentecompetitie = makeupDay.tournament.naam.toLowerCase().includes('lentecompetitie')

    // 4. Update calendar event als dat bestaat (maar 1 keer, alle klassen delen hetzelfde event)
    if (makeupDay.calendar_event_id && (data.date || data.startuur)) {
      const eventUpdateData: any = {}
      if (data.date) eventUpdateData.date = data.date
      if (data.startuur) eventUpdateData.startuur = data.startuur
      
      await calendarService.updateEvent(makeupDay.calendar_event_id, eventUpdateData)
    }

    // 5. Als dit een Lentecompetitie is, update ook de corresponderende inhaaldagen in andere klassen
    if (isLentecompetitie && (data.date || data.startuur)) {
      const allTournaments = await prisma.tournament.findMany({
        where: { 
          naam: makeupDay.tournament.naam,
          tournament_id: { not: makeupDay.tournament_id }
        },
        select: { tournament_id: true }
      })

      // Vind corresponderende inhaaldagen in andere klassen (op basis van round_after en originele date)
      for (const otherTournament of allTournaments) {
        const correspondingMakeupDay = await prisma.makeupDay.findFirst({
          where: {
            tournament_id: otherTournament.tournament_id,
            round_after: makeupDay.round_after,
            date: makeupDay.date // Match op originele date
          }
        })

        if (correspondingMakeupDay) {
          // Update de corresponderende inhaaldag
          const updateData: any = {}
          if (data.date) updateData.date = data.date
          if (data.startuur) updateData.startuur = data.startuur
          
          await prisma.makeupDay.update({
            where: { id: correspondingMakeupDay.id },
            data: updateData
          })

          // Calendar event is al geüpdatet hierboven, geen extra update nodig
        }
      }
    }

    return updatedMakeupDay
  } catch (e) {
    throw handleDBError(e)
  }
}

export async function removeMakeupDay(id: number): Promise<void> {
  try {
    // 1. Haal de huidige makeup day op voordat we hem verwijderen
    const makeupDay = await prisma.makeupDay.findUnique({
      where: { id },
      include: {
        tournament: {
          select: { naam: true }
        }
      }
    })

    if (!makeupDay) {
      throw new Error(`MakeupDay with ID ${id} not found`)
    }

    // 2. Check of dit een Lentecompetitie is
    const isLentecompetitie = makeupDay.tournament.naam.toLowerCase().includes('lentecompetitie')
    const roundAfter = makeupDay.round_after
    const date = makeupDay.date
    const calendarEventId = makeupDay.calendar_event_id

    // 3. Verwijder de makeup day
    await prisma.makeupDay.delete({ where: { id } })

    // 4. Als dit een Lentecompetitie is, verwijder ook de corresponderende inhaaldagen in andere klassen
    if (isLentecompetitie) {
      const allTournaments = await prisma.tournament.findMany({
        where: { 
          naam: makeupDay.tournament.naam,
          tournament_id: { not: makeupDay.tournament_id }
        },
        select: { tournament_id: true }
      })

      // Vind en verwijder corresponderende inhaaldagen in andere klassen
      for (const otherTournament of allTournaments) {
        const correspondingMakeupDay = await prisma.makeupDay.findFirst({
          where: {
            tournament_id: otherTournament.tournament_id,
            round_after: roundAfter,
            date: date
          }
        })

        if (correspondingMakeupDay) {
          await prisma.makeupDay.delete({ where: { id: correspondingMakeupDay.id } })
        }
      }

      // Verwijder het calendar event maar 1 keer (alle klassen delen hetzelfde event)
      if (calendarEventId) {
        // Check of er nog andere makeup days zijn die dit event gebruiken
        const remainingMakeupDays = await prisma.makeupDay.findFirst({
          where: {
            calendar_event_id: calendarEventId
          }
        })

        // Alleen verwijderen als er geen andere makeup days meer zijn die dit event gebruiken
        if (!remainingMakeupDays) {
          await calendarService.removeEvent(calendarEventId)
        }
      }
    } else {
      // Voor niet-Lentecompetitie: verwijder het calendar event als het bestaat
      if (calendarEventId) {
        await calendarService.removeEvent(calendarEventId)
      }
    }
  } catch (e) {
    throw handleDBError(e)
  }
}
