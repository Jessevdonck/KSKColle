import { prisma } from '../data'
import emailService from './emailService'
import handleDBError from './handleDBError'

/**
 * Meld afwezigheid voor een speler voor de volgende reguliere ronde
 */
export async function reportAbsence(
  user_id: number,
  tournament_id: number
): Promise<{ round_number: number }> {
  try {
    // 1. Haal speler en toernooi informatie op
    const [user, tournament] = await Promise.all([
      prisma.user.findUnique({
        where: { user_id },
        select: { voornaam: true, achternaam: true, email: true }
      }),
      prisma.tournament.findUnique({
        where: { tournament_id },
        select: { naam: true }
      })
    ])

    if (!user) {
      throw new Error(`Gebruiker met ID ${user_id} niet gevonden`)
    }

    if (!tournament) {
      throw new Error(`Toernooi met ID ${tournament_id} niet gevonden`)
    }

    // 2. Bepaal de volgende reguliere ronde nummer
    const nextRoundNumber = await getNextRegularRoundNumber(tournament_id)

    // 3. Stuur email naar toernooileiders
    const playerName = `${user.voornaam} ${user.achternaam}`
    const emailSubject = `Afwezigheid melding - ${tournament.naam}`
    const emailBody = `
Speler: ${playerName}
Email: ${user.email}
Toernooi: ${tournament.naam}
Ronde: ${nextRoundNumber}

Deze speler meldt zich af voor ronde ${nextRoundNumber} en wenst niet uitgeloot te worden.
    `.trim()
    
    const emailHtml = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
    Afwezigheid Melding
  </h2>
  
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="color: #007bff; margin-top: 0;">Speler Informatie</h3>
    <p><strong>Naam:</strong> ${playerName}</p>
    <p><strong>Email:</strong> ${user.email}</p>
  </div>
  
  <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107;">
    <h3 style="color: #856404; margin-top: 0;">Toernooi Details</h3>
    <p><strong>Toernooi:</strong> ${tournament.naam}</p>
    <p><strong>Ronde:</strong> ${nextRoundNumber}</p>
  </div>
  
  <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; border-left: 4px solid #dc3545; margin-top: 20px;">
    <p style="color: #721c24; margin: 0; font-weight: bold;">
      Deze speler meldt zich af voor ronde ${nextRoundNumber} en wenst niet uitgeloot te worden.
    </p>
  </div>
  
  <p style="color: #666; font-size: 12px; margin-top: 30px;">
    Dit bericht is automatisch gegenereerd door het KSK Colle toernooi systeem.
  </p>
</div>
    `.trim()

    // Email adressen van toernooileiders
    const tournamentLeaders = [
      'jvaerendonck@gmail.com',
      'niels.ongena@hotmail.be'
    ]

    // Stuur email naar alle toernooileider
    await Promise.all(
      tournamentLeaders.map(email => 
        emailService.sendCustomEmail({
          to: email,
          subject: emailSubject,
          text: emailBody,
          html: emailHtml
        })
      )
    )

    console.log(`Afwezigheid gemeld voor ${playerName} in toernooi ${tournament.naam} voor ronde ${nextRoundNumber}`)

    return { round_number: nextRoundNumber }

  } catch (error) {
    console.error('Error reporting absence:', error)
    throw handleDBError(error)
  }
}

/**
 * Bepaal de volgende reguliere ronde nummer (geen inhaaldagen)
 */
export async function getNextRegularRoundNumber(tournament_id: number): Promise<number> {
  try {
    // Haal alle reguliere rondes op, gesorteerd op ronde_nummer
    const regularRounds = await prisma.round.findMany({
      where: { 
        tournament_id,
        type: 'REGULAR'  // Alleen reguliere rondes, geen inhaaldagen
      },
      select: { ronde_nummer: true },
      orderBy: { ronde_nummer: 'asc' }
    })

    if (regularRounds.length === 0) {
      return 1 // Eerste ronde
    }

    // Vind de hoogste ronde nummer en tel 1 op
    const lastRoundNumber = Math.max(...regularRounds.map(r => r.ronde_nummer))
    return lastRoundNumber + 1

  } catch (error) {
    console.error('Error getting next regular round number:', error)
    throw handleDBError(error)
  }
}
