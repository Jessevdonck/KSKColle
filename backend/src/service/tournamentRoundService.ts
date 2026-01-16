import { prisma } from "./data";
import { RoundType } from "../types/Types";
import ServiceError from "../core/serviceError";
import handleDBError from "./handleDBError";
import * as calendarService from "./calendarService";
import { emailService } from "./emailService";
import { getLogger } from "../core/logging";
const logger = getLogger();

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
    // Only fetch minimal user data to reduce memory usage
    const rounds = await prisma.round.findMany({
      where: { tournament_id },
      include: {
        games: {
          select: {
            game_id: true,
            round_id: true,
            speler1_id: true,
            speler2_id: true,
            winnaar_id: true,
            result: true,
            uitgestelde_datum: true,
            board_position: true,
            original_game_id: true,
            speler1: {
              select: {
                user_id: true,
                voornaam: true,
                achternaam: true,
                schaakrating_elo: true,
              }
            },
            speler2: {
              select: {
                user_id: true,
                voornaam: true,
                achternaam: true,
                schaakrating_elo: true,
              }
            },
            winnaar: {
              select: {
                user_id: true,
                voornaam: true,
                achternaam: true,
              }
            }
          }
        }
      },
      orderBy: [
        { ronde_datum: 'asc' }, // Sorteer eerst op datum
        { ronde_nummer: 'asc' }  // Dan op ronde nummer als fallback
      ]
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
    // 1. Haal het toernooi op om te checken of het een Lentecompetitie is
    const tournament = await prisma.tournament.findUnique({
      where: { tournament_id },
      select: { naam: true }
    });

    if (!tournament) {
      throw ServiceError.notFound(`Toernooi met ID ${tournament_id} niet gevonden`);
    }

    const isLentecompetitie = tournament.naam.toLowerCase().includes('lentecompetitie');

    // 2. Haal alle bestaande rondes op
    const existingRounds = await prisma.round.findMany({
      where: { tournament_id },
      orderBy: { ronde_nummer: 'asc' }
    });

    // 3. Bepaal het juiste ronde nummer
    const correctRoundNumber = determineMakeupRoundNumber(existingRounds, after_round_number);

    // 4. Verschuif alle rondes na de inhaaldag
    await shiftRoundsAfter(tournament_id, correctRoundNumber);

    // 5. Bepaal het inhaaldag nummer
    const makeupDayNumber = getMakeupDayNumber(existingRounds);

    // 6. Maak de inhaaldag ronde aan
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

    // 7. Maak calendar event aan
    const eventTitle = `${tournament.naam} - Inhaaldag ${makeupDayNumber}`;
    
    const calendarEvent = await calendarService.createEvent({
      title: eventTitle,
      description: `Inhaaldag voor uitgestelde partijen`,
      type: "Inhaaldag",
      date: date,
      startuur: startuur,
      tournament_id: tournament_id,
    });

    // 8. Update de ronde met calendar event ID
    await prisma.round.update({
      where: { round_id: makeupRound.round_id },
      data: { calendar_event_id: calendarEvent.event_id }
    });

    // 9. Als dit een Lentecompetitie is, maak dezelfde inhaaldag aan voor alle andere klassen
    if (isLentecompetitie) {
      const allTournaments = await prisma.tournament.findMany({
        where: { 
          naam: tournament.naam,
          tournament_id: { not: tournament_id }
        },
        select: { tournament_id: true }
      });

      // Maak voor elk ander toernooi dezelfde inhaaldag aan
      for (const otherTournament of allTournaments) {
        // Haal bestaande rondes op voor dit toernooi
        const otherExistingRounds = await prisma.round.findMany({
          where: { tournament_id: otherTournament.tournament_id },
          orderBy: { ronde_nummer: 'asc' }
        });

        // Bepaal het juiste ronde nummer voor dit toernooi
        const otherCorrectRoundNumber = determineMakeupRoundNumber(otherExistingRounds, after_round_number);

        // Verschuif rondes indien nodig
        await shiftRoundsAfter(otherTournament.tournament_id, otherCorrectRoundNumber);

        // Bepaal inhaaldag nummer voor dit toernooi
        const otherMakeupDayNumber = getMakeupDayNumber(otherExistingRounds);

        // Maak de inhaaldag ronde aan met hetzelfde calendar_event_id (delen hetzelfde event)
        await prisma.round.create({
          data: {
            tournament_id: otherTournament.tournament_id,
            ronde_nummer: otherCorrectRoundNumber,
            ronde_datum: date,
            startuur,
            type: RoundType.MAKEUP,
            label: label || `Inhaaldag ${otherMakeupDayNumber}`,
            is_sevilla_imported: false,
            calendar_event_id: calendarEvent.event_id, // Deel hetzelfde calendar event
          },
        });

        // Geen extra calendar event aanmaken - we delen hetzelfde event
      }
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

    // 2. Admin functie - geen validatie op gespeelde games
    // Admins kunnen altijd games uitstellen, zelfs als ze al gespeeld zijn

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

    // 6. Controleer of beide spelers vrij zijn op deze inhaaldag
    const orConditions = [
      { speler1_id: originalGame.speler1_id },
      { speler2_id: originalGame.speler1_id }
    ];

    if (originalGame.speler2_id) {
      orConditions.push(
        { speler1_id: originalGame.speler2_id },
        { speler2_id: originalGame.speler2_id }
      );
    }

    const existingGames = await prisma.game.findMany({
      where: {
        round_id: makeup_round_id,
        OR: orConditions
      },
      include: {
        speler1: true,
        speler2: true
      }
    });

    if (existingGames.length > 0) {
      const conflictingPlayers: string[] = [];
      for (const existingGame of existingGames) {
        if (existingGame.speler1_id === originalGame.speler1_id) {
          conflictingPlayers.push(`${existingGame.speler1.voornaam} ${existingGame.speler1.achternaam}`);
        }
        if (existingGame.speler2_id === originalGame.speler1_id && existingGame.speler2) {
          conflictingPlayers.push(`${existingGame.speler2.voornaam} ${existingGame.speler2.achternaam}`);
        }
        if (originalGame.speler2_id) {
          if (existingGame.speler1_id === originalGame.speler2_id) {
            conflictingPlayers.push(`${existingGame.speler1.voornaam} ${existingGame.speler1.achternaam}`);
          }
          if (existingGame.speler2_id === originalGame.speler2_id && existingGame.speler2) {
            conflictingPlayers.push(`${existingGame.speler2.voornaam} ${existingGame.speler2.achternaam}`);
          }
        }
      }
      
      const uniquePlayers = [...new Set(conflictingPlayers)];
      const playerList = uniquePlayers.join(' en ');
      
      throw ServiceError.validationFailed(
        `Niet mogelijk: ${playerList} ${uniquePlayers.length === 1 ? 'heeft' : 'hebben'} al een partij op deze speeldag`
      );
    }

    // 7. Markeer de originele game als uitgesteld
    await prisma.game.update({
      where: { game_id },
      data: {
        result: 'uitgesteld',
        uitgestelde_datum: new Date()
      }
    });

    // 8. Maak een nieuwe game aan in de inhaaldag
    const newGame = await prisma.game.create({
      data: {
        round_id: makeup_round_id,
        speler1_id: originalGame.speler1_id,
        speler2_id: originalGame.speler2_id,
        winnaar_id: null,
        result: null, // Nieuwe game zonder resultaat
        uitgestelde_datum: null, // Nieuwe game is niet uitgesteld
        original_game_id: game_id // Verwijs naar de originele game
      },
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

    // 9. Stuur email notificaties naar beide spelers en admin
    await sendAdminPostponeNotifications(originalGame, newGame, makeup_round_id);

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
      select: {
        type: true,
        calendar_event_id: true,
        ronde_datum: true,
        ronde_nummer: true,
        tournament: {
          select: { naam: true, tournament_id: true }
        }
      }
    });

    if (!round || round.type !== RoundType.MAKEUP) {
      throw ServiceError.validationFailed(`Ronde ${round_id} is geen inhaaldag`);
    }

    const isLentecompetitie = round.tournament.naam.toLowerCase().includes('lentecompetitie');
    const originalDate = round.ronde_datum;
    const originalRoundNumber = round.ronde_nummer;

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

    // Update calendar event (maar 1 keer, alle klassen delen hetzelfde event)
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

    // Als dit een Lentecompetitie is, update ook de corresponderende inhaaldagen in andere klassen
    if (isLentecompetitie) {
      const allTournaments = await prisma.tournament.findMany({
        where: { 
          naam: round.tournament.naam,
          tournament_id: { not: round.tournament.tournament_id }
        },
        select: { tournament_id: true }
      });

      // Vind corresponderende inhaaldagen in andere klassen (op basis van ronde_nummer en originele date)
      for (const otherTournament of allTournaments) {
        const correspondingRound = await prisma.round.findFirst({
          where: {
            tournament_id: otherTournament.tournament_id,
            ronde_nummer: originalRoundNumber,
            ronde_datum: originalDate,
            type: RoundType.MAKEUP
          }
        });

        if (correspondingRound) {
          // Update de corresponderende inhaaldag
          await prisma.round.update({
            where: { round_id: correspondingRound.round_id },
            data: updateData
          });

          // Calendar event is al geüpdatet hierboven, geen extra update nodig
        }
      }
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
      select: {
        type: true,
        calendar_event_id: true,
        ronde_datum: true,
        ronde_nummer: true,
        tournament: {
          select: { naam: true, tournament_id: true }
        }
      }
    });

    if (!round || round.type !== RoundType.MAKEUP) {
      throw ServiceError.validationFailed(`Ronde ${round_id} is geen inhaaldag`);
    }

    const isLentecompetitie = round.tournament.naam.toLowerCase().includes('lentecompetitie');
    const originalDate = round.ronde_datum;
    const originalRoundNumber = round.ronde_nummer;

    const calendarEventId = round.calendar_event_id;

    // Verwijder de ronde (games worden automatisch verwijderd)
    await prisma.round.delete({
      where: { round_id }
    });

    // Verschuif alle rondes na deze ronde terug
    await shiftRoundsBack(round.tournament.tournament_id, originalRoundNumber);

    // Als dit een Lentecompetitie is, verwijder ook de corresponderende inhaaldagen in andere klassen
    if (isLentecompetitie) {
      const allTournaments = await prisma.tournament.findMany({
        where: { 
          naam: round.tournament.naam,
          tournament_id: { not: round.tournament.tournament_id }
        },
        select: { tournament_id: true }
      });

      // Vind en verwijder corresponderende inhaaldagen in andere klassen
      for (const otherTournament of allTournaments) {
        const correspondingRound = await prisma.round.findFirst({
          where: {
            tournament_id: otherTournament.tournament_id,
            ronde_nummer: originalRoundNumber,
            ronde_datum: originalDate,
            type: RoundType.MAKEUP
          }
        });

        if (correspondingRound) {
          // Verwijder de ronde
          await prisma.round.delete({
            where: { round_id: correspondingRound.round_id }
          });

          // Verschuif rondes terug
          await shiftRoundsBack(otherTournament.tournament_id, originalRoundNumber);
        }
      }

      // Verwijder het calendar event maar 1 keer (alle klassen delen hetzelfde event)
      if (calendarEventId) {
        // Check of er nog andere rounds zijn die dit event gebruiken
        const remainingRounds = await prisma.round.findFirst({
          where: {
            calendar_event_id: calendarEventId
          }
        });

        // Alleen verwijderen als er geen andere rounds meer zijn die dit event gebruiken
        if (!remainingRounds) {
          await calendarService.deleteEvent(calendarEventId);
        }
      }
    } else {
      // Voor niet-Lentecompetitie: verwijder het calendar event als het bestaat
      if (calendarEventId) {
        await calendarService.deleteEvent(calendarEventId);
      }
    }
  } catch (error) {
    throw handleDBError(error);
  }
}

/**
 * Bepaal het juiste ronde nummer voor een inhaaldag
 */
function determineMakeupRoundNumber(_existingRounds: any[], after_round_number: number): number {
  // Gebruik offset van 1000 + round_after om conflicten met reguliere rondes te vermijden
  return after_round_number + 1000;
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

/**
 * Stuur email notificaties wanneer een admin een partij uitstelt
 */
async function sendAdminPostponeNotifications(originalGame: any, newGame: any, makeup_round_id: number): Promise<void> {
  try {
    // Haal de inhaaldag ronde op
    const makeupRound = await prisma.round.findUnique({
      where: { round_id: makeup_round_id }
    });

    if (!makeupRound) {
      logger.error('Makeup round not found for email notifications', { makeup_round_id });
      return;
    }

    // Stuur email naar speler 1
    if (originalGame.speler1 && originalGame.speler1.email) {
      await sendPlayerPostponeNotification(originalGame.speler1, originalGame.speler2, newGame, makeupRound, originalGame.round.tournament);
    }

    // Wacht 1 seconde om rate limiting te voorkomen
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Stuur email naar speler 2 (als die bestaat)
    if (originalGame.speler2 && originalGame.speler2.email) {
      await sendPlayerPostponeNotification(originalGame.speler2, originalGame.speler1, newGame, makeupRound, originalGame.round.tournament);
    }

    // Wacht 1 seconde om rate limiting te voorkomen
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Stuur bevestiging email naar admin
    await sendAdminConfirmationNotification(originalGame, newGame, makeupRound);

  } catch (error) {
    logger.error('Failed to send admin postpone notifications', { 
      error: error instanceof Error ? error.message : String(error),
      original_game_id: originalGame.game_id,
      new_game_id: newGame.game_id
    });
    // We gooien de error niet door omdat de uitstel wel succesvol is
  }
}

/**
 * Stuur email notificatie naar een speler
 */
async function sendPlayerPostponeNotification(player: any, opponent: any, _newGame: any, newRound: any, tournament: any): Promise<void> {
  try {
    const subject = `KSK Colle - Partij Uitgesteld (Admin)`;
    
    const opponentName = opponent ? `${opponent.voornaam} ${opponent.achternaam}` : 'BYE';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; }
          .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>KSK Colle</h1>
            <h2>Partij Uitgesteld (Admin)</h2>
          </div>
          
          <div class="content">
            <p>Beste ${player.voornaam} ${player.achternaam},</p>
            
            <p>Je partij tegen <strong>${opponentName}</strong> in het toernooi <strong>${tournament.naam}</strong> is door een admin uitgesteld.</p>
            
            <p><strong>Nieuwe datum:</strong> ${newRound.ronde_datum.toLocaleDateString('nl-BE')} om ${newRound.startuur}</p>
            
            <p>Je kunt de toernooi details bekijken op de website.</p>
          </div>
          
          <div class="footer">
            <p>Met vriendelijke groet,<br>Het KSK Colle Team</p>
            <p>Deze email is automatisch gegenereerd. Reageer niet op deze email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      KSK Colle - Partij Uitgesteld (Admin)
      
      Beste ${player.voornaam} ${player.achternaam},
      
      Je partij tegen ${opponentName} in het toernooi ${tournament.naam} is door een admin uitgesteld.
      
      Nieuwe datum: ${newRound.ronde_datum.toLocaleDateString('nl-BE')} om ${newRound.startuur}
      
      Je kunt de toernooi details bekijken op de website.
      
      Met vriendelijke groet,
      Het KSK Colle Team
      
      Deze email is automatisch gegenereerd. Reageer niet op deze email.
    `;

    await emailService.sendCustomEmail({
      to: player.email,
      subject: subject,
      html: htmlContent,
      text: textContent
    });

    logger.info('Player postpone notification sent', {
      to: player.email,
      player_name: `${player.voornaam} ${player.achternaam}`,
      tournament: tournament.naam
    });

  } catch (error) {
    logger.error('Failed to send player postpone notification', {
      error: error instanceof Error ? error.message : String(error),
      player_email: player.email
    });
  }
}

/**
 * Stuur bevestiging email naar admin
 */
async function sendAdminConfirmationNotification(originalGame: any, newGame: any, newRound: any): Promise<void> {
  try {
    const adminEmail = 'niels.ongena@hotmail.be';
    const subject = `KSK Colle - Admin: Partij Uitgesteld`;
    
    const speler1Name = `${originalGame.speler1.voornaam} ${originalGame.speler1.achternaam}`;
    const speler2Name = originalGame.speler2 ? `${originalGame.speler2.voornaam} ${originalGame.speler2.achternaam}` : 'BYE';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #e8f5e8; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; }
          .info-box { background-color: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>KSK Colle</h1>
            <h2>Admin Bevestiging: Partij Uitgesteld</h2>
          </div>
          
          <div class="content">
            <p>Beste Admin,</p>
            
            <p>De volgende partij is succesvol uitgesteld:</p>
            
            <div class="info-box">
              <p><strong>Spelers:</strong> ${speler1Name} vs ${speler2Name}</p>
              <p><strong>Toernooi:</strong> ${originalGame.round.tournament.naam}</p>
              <p><strong>Originele ronde:</strong> ${originalGame.round.ronde_nummer}</p>
              <p><strong>Nieuwe datum:</strong> ${newRound.ronde_datum.toLocaleDateString('nl-BE')} om ${newRound.startuur}</p>
              <p><strong>Game ID's:</strong> Origineel: ${originalGame.game_id}, Nieuw: ${newGame.game_id}</p>
            </div>
            
            <p>Beide spelers hebben een notificatie ontvangen over de uitstel.</p>
          </div>
          
          <div class="footer">
            <p>Met vriendelijke groet,<br>Het KSK Colle Systeem</p>
            <p>Deze email is automatisch gegenereerd.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      KSK Colle - Admin Bevestiging: Partij Uitgesteld
      
      Beste Admin,
      
      De volgende partij is succesvol uitgesteld:
      
      Spelers: ${speler1Name} vs ${speler2Name}
      Toernooi: ${originalGame.round.tournament.naam}
      Originele ronde: ${originalGame.round.ronde_nummer}
      Nieuwe datum: ${newRound.ronde_datum.toLocaleDateString('nl-BE')} om ${newRound.startuur}
      Game ID's: Origineel: ${originalGame.game_id}, Nieuw: ${newGame.game_id}
      
      Beide spelers hebben een notificatie ontvangen over de uitstel.
      
      Met vriendelijke groet,
      Het KSK Colle Systeem
      
      Deze email is automatisch gegenereerd.
    `;

    await emailService.sendCustomEmail({
      to: adminEmail,
      subject: subject,
      html: htmlContent,
      text: textContent
    });

    logger.info('Admin confirmation notification sent', {
      to: adminEmail,
      original_game_id: originalGame.game_id,
      new_game_id: newGame.game_id,
      tournament: originalGame.round.tournament.naam
    });

  } catch (error) {
    logger.error('Failed to send admin confirmation notification', {
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
