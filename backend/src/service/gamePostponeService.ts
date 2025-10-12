import { prisma } from "./data";
import ServiceError from "../core/serviceError";
import handleDBError from "./handleDBError";
import { RoundType } from "@prisma/client";
import emailService from "./emailService";
import { createNotification } from "./notificationService";
import { NotificationTypes } from "../types/notification";
import { getLogger } from "../core/logging";
const logger = getLogger();

/**
 * Check if a user is an admin
 */
async function isUserAdmin(user_id: number): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id },
      select: { is_admin: true, roles: true }
    });
    
    if (!user) return false;
    
    // Check both is_admin flag and roles array
    if (user.is_admin) return true;
    
    // Check if roles array contains 'admin'
    if (user.roles && Array.isArray(user.roles) && user.roles.includes('admin')) {
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error('Error checking admin status', { user_id, error });
    return false;
  }
}

export interface PostponeGameData {
  game_id: number;
  user_id: number; // De gebruiker die de uitstel aanvraagt
  makeup_round_id?: number; // Optionele specifieke inhaaldag voor lente toernooien
}

export interface PostponeGameResponse {
  success: boolean;
  message: string;
  new_round_id: number;
  new_round_date: Date;
}

export interface UndoPostponeGameData {
  game_id: number;
  user_id: number; // De gebruiker die de uitstel ongedaan maakt
}

export interface UndoPostponeGameResponse {
  success: boolean;
  message: string;
  original_game_id: number;
  restored_round_id: number;
}

/**
 * Stel een game uit naar de volgende beschikbare inhaaldag
 * Validatie:
 * - Alleen de speler zelf kan zijn eigen game uitstellen
 * - Game moet nog niet gespeeld zijn (geen result)
 * - Voor herfst: alleen naar eerstvolgende inhaaldag
 * - Voor lente: naar beschikbare inhaaldag zonder conflicten
 */
export async function postponeGame(data: PostponeGameData): Promise<PostponeGameResponse> {
  try {
    logger.info('Starting postpone game process', { game_id: data.game_id, user_id: data.user_id });
    
    // Test database connectie
    try {
      await prisma.$queryRaw`SELECT 1`;
      logger.info('Database connection test successful');
    } catch (dbError) {
      logger.error('Database connection test failed', { 
        error: dbError instanceof Error ? dbError.message : String(dbError),
        stack: dbError instanceof Error ? dbError.stack : undefined
      });
      throw ServiceError.internalServerError('Database connection failed');
    }
    
    // 1. Haal game op met alle relevante data
    const game = await prisma.game.findUnique({
      where: { game_id: data.game_id },
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

    if (!game) {
      logger.error('Game not found', { game_id: data.game_id });
      throw ServiceError.notFound('Game niet gevonden');
    }

    logger.info('Game found', { 
      game_id: game.game_id, 
      speler1_id: game.speler1_id, 
      speler2_id: game.speler2_id,
      result: game.result,
      uitgestelde_datum: game.uitgestelde_datum,
      tournament_naam: game.round.tournament.naam
    });

    // 2. Controleer of de gebruiker een van de spelers is
    logger.info('Checking user permissions', { 
      user_id: data.user_id, 
      speler1_id: game.speler1_id, 
      speler2_id: game.speler2_id 
    });
    
    if (game.speler1_id !== data.user_id && game.speler2_id !== data.user_id) {
      throw ServiceError.forbidden('Je kunt alleen je eigen partijen uitstellen');
    }

    // 3. Controleer of de game al gespeeld is (tenzij gebruiker admin is)
    logger.info('Checking game status', { 
      result: game.result, 
      uitgestelde_datum: game.uitgestelde_datum 
    });
    
    // Game is gespeeld als er een geldig resultaat is (niet null, "...", of "not_played")
    const isPlayed = game.result && 
                     game.result !== "..." && 
                     game.result !== "not_played" &&
                     game.result !== "null";
    
    // Check if user is admin
    const isAdmin = await isUserAdmin(data.user_id);
    
    if (isPlayed && !isAdmin) {
      throw ServiceError.validationFailed('Deze partij is al gespeeld en kan niet meer uitgesteld worden');
    }
    
    if (isPlayed && isAdmin) {
      logger.info('Admin user postponing already played game', { 
        game_id: data.game_id, 
        user_id: data.user_id, 
        result: game.result 
      });
    }

    // 4. Controleer of de game al uitgesteld is
    if (game.uitgestelde_datum) {
      throw ServiceError.validationFailed('Deze partij is al uitgesteld');
    }

    // 5. Bepaal of het een herfst of lente toernooi is
    const tournamentName = game.round.tournament.naam.toLowerCase();
    const isHerfst = tournamentName.includes('herfst');
    const isLente = tournamentName.includes('lente');

    logger.info('Tournament type determined', { 
      tournament_name: game.round.tournament.naam,
      isHerfst, 
      isLente 
    });

    // 6. Zoek beschikbare inhaaldagen
    const makeupRounds = await prisma.round.findMany({
      where: {
        tournament_id: game.round.tournament_id,
        type: RoundType.MAKEUP,
        ronde_datum: {
          gte: new Date() // Alleen toekomstige inhaaldagen
        }
      },
      orderBy: {
        ronde_datum: 'asc'
      }
    });

    logger.info('Found makeup rounds', { 
      tournament_id: game.round.tournament_id,
      makeup_rounds_count: makeupRounds.length,
      makeup_rounds: makeupRounds.map(r => ({ 
        round_id: r.round_id, 
        ronde_datum: r.ronde_datum, 
        label: r.label 
      }))
    });

    if (makeupRounds.length === 0) {
      logger.error('No makeup rounds found', { tournament_id: game.round.tournament_id });
      throw ServiceError.validationFailed('Geen beschikbare inhaaldagen gevonden');
    }

    let targetRound;
    
    if (isHerfst) {
      // Voor herfst: alleen de eerstvolgende inhaaldag
      targetRound = makeupRounds[0];
      if (!targetRound) {
        throw ServiceError.validationFailed('Geen inhaaldagen beschikbaar voor herfst toernooi');
      }
      logger.info('Selected target round for herfst', { 
        target_round_id: targetRound.round_id,
        target_round_date: targetRound.ronde_datum
      });
    } else if (isLente) {
      // Voor lente: gebruik geselecteerde inhaaldag of eerste beschikbare
      if (data.makeup_round_id) {
        targetRound = makeupRounds.find(r => r.round_id === data.makeup_round_id);
        if (!targetRound) {
          logger.error('Selected makeup round not found', { 
            selected_round_id: data.makeup_round_id,
            available_rounds: makeupRounds.map(r => r.round_id)
          });
          throw ServiceError.validationFailed('Geselecteerde inhaaldag niet gevonden');
        }
      } else {
        targetRound = makeupRounds[0]; // Gebruik de eerste beschikbare als fallback
        if (!targetRound) {
          throw ServiceError.validationFailed('Geen inhaaldagen beschikbaar voor lente toernooi');
        }
      }
      logger.info('Selected target round for lente', { 
        target_round_id: targetRound.round_id,
        target_round_date: targetRound.ronde_datum,
        user_selected: !!data.makeup_round_id
      });
    } else {
      // Voor andere toernooien: zoek een inhaaldag zonder conflicten
      targetRound = await findAvailableMakeupRound(game, makeupRounds);
      
      if (!targetRound) {
        logger.error('No available makeup round found', { 
          game_id: game.game_id,
          tournament_id: game.round.tournament_id,
          tournament_type: 'other'
        });
        throw ServiceError.validationFailed('Geen beschikbare inhaaldag zonder conflicten gevonden');
      }
      
      logger.info('Selected target round for other', { 
        target_round_id: targetRound.round_id,
        target_round_date: targetRound.ronde_datum
      });
    }

    // 7. Markeer de originele game als uitgesteld en maak een kopie in de inhaaldag
    logger.info('Marking original game as postponed and creating copy in makeup round', { 
      game_id: data.game_id, 
      new_round_id: targetRound.round_id 
    });
    
    // Eerst: markeer de originele game als uitgesteld (blijft in originele ronde)
    const originalGame = await prisma.game.update({
      where: { game_id: data.game_id },
      data: {
        uitgestelde_datum: new Date(),
        result: 'uitgesteld' // Markeer als uitgesteld
      },
      include: {
        speler1: true,
        speler2: true,
        round: true
      }
    });

    logger.info('Original game marked as postponed', { 
      game_id: originalGame.game_id,
      original_round_id: originalGame.round_id,
      result: originalGame.result
    });

    // Dan: maak een nieuwe game aan in de inhaaldag
    const newGame = await prisma.game.create({
      data: {
        round_id: targetRound.round_id,
        speler1_id: game.speler1_id,
        speler2_id: game.speler2_id,
        winnaar_id: null,
        result: null, // Nieuwe game zonder resultaat
        uitgestelde_datum: null // Nieuwe game is niet uitgesteld
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

    logger.info('New game created in makeup round', { 
      new_game_id: newGame.game_id,
      new_round_id: newGame.round_id,
      speler1_id: newGame.speler1_id,
      speler2_id: newGame.speler2_id
    });

    // 8. Stuur notificaties naar beide spelers en alle admins
    const postponingPlayer = game.speler1_id === data.user_id ? game.speler1 : game.speler2;
    const opponent = game.speler1_id === data.user_id ? game.speler2 : game.speler1;
    
    logger.info('Sending notifications and emails', { 
      opponent_id: opponent?.user_id,
      opponent_name: opponent ? `${opponent.voornaam} ${opponent.achternaam}` : 'null',
      opponent_email: opponent?.email,
      postponing_user_id: data.user_id,
      postponing_player_name: postponingPlayer ? `${postponingPlayer.voornaam} ${postponingPlayer.achternaam}` : 'null'
    });
    
    // Notificatie en email naar tegenstander
    if (opponent) {
      logger.info('Sending notifications to opponent', {
        opponent_email: opponent.email,
        opponent_name: `${opponent.voornaam} ${opponent.achternaam}`
      });
      
      try {
        // Email naar tegenstander
        await sendPostponeNotification(opponent, newGame, targetRound, data.user_id, game.round.tournament);
        logger.info('Email notification sent to opponent successfully');
        
        // Site notificatie naar tegenstander
        await createNotification({
          user_id: opponent.user_id,
          type: NotificationTypes.GAME_POSTPONED,
          title: 'Partij uitgesteld',
          message: `Je partij tegen ${postponingPlayer?.voornaam} ${postponingPlayer?.achternaam} in ${game.round.tournament.naam} is uitgesteld naar ${targetRound.ronde_datum.toLocaleDateString('nl-BE')}`,
        });
        logger.info('Site notification sent to opponent successfully');
      } catch (error) {
        logger.error('Failed to send notifications to opponent', { 
          error,
          opponent_email: opponent.email 
        });
        // We gooien de error niet door omdat de uitstel wel succesvol is
      }
    }
    
    // Notificatie en email naar de speler die het uitstel aanvroeg
    if (postponingPlayer && postponingPlayer.user_id !== opponent?.user_id) {
      try {
        // Site notificatie naar de speler zelf
        await createNotification({
          user_id: postponingPlayer.user_id,
          type: NotificationTypes.GAME_POSTPONED,
          title: 'Partij uitgesteld bevestiging',
          message: `Je partij tegen ${opponent?.voornaam} ${opponent?.achternaam} in ${game.round.tournament.naam} is succesvol uitgesteld naar ${targetRound.ronde_datum.toLocaleDateString('nl-BE')}`,
        });
        logger.info('Site notification sent to postponing player successfully');
      } catch (error) {
        logger.error('Failed to send notification to postponing player', { error });
      }
    }
    
    // Notificaties en emails naar alle admins
    try {
      const admins = await prisma.user.findMany({
        where: {
          OR: [
            { is_admin: true },
            { roles: { array_contains: 'admin' } }
          ]
        }
      });
      
      logger.info('Found admins for notifications', { admin_count: admins.length });
      
      for (const admin of admins) {
        try {
          // Site notificatie naar admin
          await createNotification({
            user_id: admin.user_id,
            type: NotificationTypes.GAME_POSTPONED,
            title: '[ADMIN] Partij uitgesteld',
            message: `${postponingPlayer?.voornaam} ${postponingPlayer?.achternaam} heeft een partij uitgesteld tegen ${opponent?.voornaam} ${opponent?.achternaam} in ${game.round.tournament.naam}. Nieuwe datum: ${targetRound.ronde_datum.toLocaleDateString('nl-BE')}`,
          });
          
          // Email naar admin
          const adminSubject = `[ADMIN] Partij uitgesteld - ${game.round.tournament.naam}`;
          const adminHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px; }
                .admin-notice { background-color: #007bff; color: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
                .content { padding: 20px; }
                .info-box { background-color: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>KSK Colle - Admin Notificatie</h1>
                  <h2>Partij Uitgesteld</h2>
                </div>
                
                <div class="admin-notice">
                  <strong>⚠️ ADMIN NOTIFICATIE</strong><br>
                  Dit is een automatische melding voor administratoren.
                </div>
                
                <div class="content">
                  <div class="info-box">
                    <p><strong>Toernooi:</strong> ${game.round.tournament.naam}</p>
                    <p><strong>Speler die uitstel aanvroeg:</strong> ${postponingPlayer?.voornaam} ${postponingPlayer?.achternaam}</p>
                    <p><strong>Tegenstander:</strong> ${opponent?.voornaam} ${opponent?.achternaam}</p>
                    <p><strong>Originele ronde:</strong> Ronde ${game.round.ronde_nummer}</p>
                    <p><strong>Nieuwe datum:</strong> ${targetRound.ronde_datum.toLocaleDateString('nl-BE')} om ${targetRound.startuur}</p>
                    <p><strong>Inhaaldag:</strong> ${targetRound.label || 'Inhaaldag'}</p>
                  </div>
                  
                  <p>Beide spelers hebben een notificatie ontvangen op de website en via email.</p>
                </div>
                
                <div class="footer">
                  <p>KSK Colle Admin Systeem</p>
                  <p>Deze email is automatisch gegenereerd.</p>
                </div>
              </div>
            </body>
            </html>
          `;
          
          // Alleen email sturen als admin een email adres heeft
          if (admin.email) {
            await emailService.sendCustomEmail({
              to: admin.email,
              subject: adminSubject,
              html: adminHtml,
              text: `[ADMIN] Partij uitgesteld\n\nToernooi: ${game.round.tournament.naam}\nSpeler: ${postponingPlayer?.voornaam} ${postponingPlayer?.achternaam}\nTegenstander: ${opponent?.voornaam} ${opponent?.achternaam}\nNieuwe datum: ${targetRound.ronde_datum.toLocaleDateString('nl-BE')}`
            });
          }
          
          logger.info('Notifications sent to admin successfully', { admin_id: admin.user_id, admin_email: admin.email });
        } catch (adminError) {
          logger.error('Failed to send notification to admin', { admin_id: admin.user_id, error: adminError });
          // Continue met de volgende admin
        }
      }
    } catch (error) {
      logger.error('Failed to get or notify admins', { error });
      // We gooien de error niet door omdat de uitstel wel succesvol is
    }

    logger.info('Game postponed successfully', {
      original_game_id: data.game_id,
      new_game_id: newGame.game_id,
      user_id: data.user_id,
      new_round_id: targetRound.round_id,
      new_round_date: targetRound.ronde_datum
    });

    return {
      success: true,
      message: `Partij succesvol uitgesteld naar ${targetRound.label || 'inhaaldag'} op ${targetRound.ronde_datum.toLocaleDateString('nl-BE')}`,
      new_round_id: targetRound.round_id,
      new_round_date: targetRound.ronde_datum
    };

  } catch (error) {
    // Eerst checken of error bestaat voordat we logging proberen
    if (!error) {
      logger.error('Error is undefined or null', { data });
      throw ServiceError.internalServerError('An unexpected error occurred during game postponement');
    }
    
    // Veilige logging
    try {
      logger.error('Failed to postpone game', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        data,
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorCode: error instanceof Error ? (error as any).code : 'Unknown',
        errorType: typeof error
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
      console.error('Original error:', error);
    }
    
    // Als het al een ServiceError is, gooi deze direct door
    if (error instanceof ServiceError) {
      throw error;
    }
    
    // Anders, probeer het te transformeren via handleDBError
    try {
      throw handleDBError(error);
    } catch (transformedError) {
      // Als handleDBError ook faalt, gooi de originele error door met meer context
      try {
        logger.error('handleDBError also failed', { 
          originalError: error instanceof Error ? error.message : String(error),
          transformedError: transformedError instanceof Error ? transformedError.message : String(transformedError)
        });
      } catch (logError2) {
        console.error('Failed to log transformed error:', logError2);
      }
      throw ServiceError.internalServerError(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Zoek een beschikbare inhaaldag zonder conflicten voor lente toernooien
 */
async function findAvailableMakeupRound(game: any, makeupRounds: any[]): Promise<any | null> {
  logger.info('Finding available makeup round', { 
    game_id: game.game_id, 
    speler1_id: game.speler1_id, 
    speler2_id: game.speler2_id,
    makeup_rounds_count: makeupRounds.length 
  });

  for (const makeupRound of makeupRounds) {
    // Bouw de OR conditie op basis van beschikbare spelers
    const orConditions = [
      { speler1_id: game.speler1_id },
      { speler2_id: game.speler1_id }
    ];

    // Voeg speler2 condities alleen toe als speler2 bestaat
    if (game.speler2_id) {
      orConditions.push(
        { speler1_id: game.speler2_id },
        { speler2_id: game.speler2_id }
      );
    }

    // Controleer of een van de spelers al een game heeft op deze inhaaldag
    const existingGames = await prisma.game.findMany({
      where: {
        round_id: makeupRound.round_id,
        OR: orConditions
      }
    });

    logger.info('Checked makeup round for conflicts', {
      makeup_round_id: makeupRound.round_id,
      existing_games_count: existingGames.length,
      or_conditions: orConditions
    });

    // Als er geen conflicten zijn, kunnen we deze inhaaldag gebruiken
    if (existingGames.length === 0) {
      logger.info('Found available makeup round', { makeup_round_id: makeupRound.round_id });
      return makeupRound;
    }
  }

  logger.warn('No available makeup round found', { game_id: game.game_id });
  return null;
}

/**
 * Stuur email notificatie naar de tegenstander
 */
async function sendPostponeNotification(opponent: any, game: any, newRound: any, postponingUserId: number, tournament: any): Promise<void> {
  try {
    logger.info('sendPostponeNotification called', {
      opponent_id: opponent.user_id,
      opponent_email: opponent.email,
      game_id: game.game_id,
      postponing_user_id: postponingUserId,
      speler1_id: game.speler1_id,
      speler2_id: game.speler2_id
    });

    // Bepaal wie de uitstel heeft aangevraagd
    const postponingPlayer = game.speler1_id === postponingUserId ? game.speler1 : game.speler2;
    
    logger.info('Postponing player determined', {
      postponing_player_id: postponingPlayer?.user_id,
      postponing_player_name: postponingPlayer ? `${postponingPlayer.voornaam} ${postponingPlayer.achternaam}` : 'null'
    });
    
    // Check if postponingPlayer exists
    if (!postponingPlayer) {
      logger.warn('Cannot send postpone notification - postponingPlayer is null', {
        game_id: game.game_id,
        opponent_id: opponent.user_id,
        postponing_user_id: postponingUserId,
        speler1_id: game.speler1_id,
        speler2_id: game.speler2_id
      });
      return;
    }
    
    const subject = `Partij uitgesteld - ${tournament.naam}`;
    
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
            <h2>Partij Uitgesteld</h2>
          </div>
          
          <div class="content">
            <p>Beste ${opponent.voornaam} ${opponent.achternaam},</p>
            
            <p>Je partij tegen <strong>${postponingPlayer.voornaam} ${postponingPlayer.achternaam}</strong> in het toernooi <strong>${tournament.naam}</strong> is uitgesteld.</p>
            
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
      KSK Colle - Partij Uitgesteld
      
      Beste ${opponent.voornaam} ${opponent.achternaam},
      
      Je partij tegen ${postponingPlayer.voornaam} ${postponingPlayer.achternaam} in het toernooi ${tournament.naam} is uitgesteld.
      
      Nieuwe datum: ${newRound.ronde_datum.toLocaleDateString('nl-BE')} om ${newRound.startuur}
      
      Je kunt de toernooi details bekijken op de website.
      
      Met vriendelijke groet,
      Het KSK Colle Team
      
      Deze email is automatisch gegenereerd. Reageer niet op deze email.
    `;

    logger.info('Attempting to send email', {
      to: opponent.email,
      subject: subject,
      opponent_id: opponent.user_id
    });

    // Stuur email naar de tegenstander
    await emailService.sendCustomEmail({
      to: opponent.email,
      subject: subject,
      html: htmlContent,
      text: textContent
    });


    logger.info('Postpone notification sent successfully', {
      opponent_id: opponent.user_id,
      opponent_email: opponent.email,
      game_id: game.game_id
    });

  } catch (error) {
    logger.error('Failed to send postpone notification', { error, opponent_id: opponent.user_id });
    // We gooien de error niet door omdat de uitstel wel succesvol is
  }
}

/**
 * Haal alle games op die een gebruiker kan uitstellen
 */
export async function getPostponableGames(user_id: number, tournament_id: number): Promise<any[]> {
  try {
    // Check if user is admin
    const isAdmin = await isUserAdmin(user_id);
    
    let whereClause: any = {
      round: {
        tournament_id: tournament_id
      },
      AND: [
        {
          OR: [
            { speler1_id: user_id },
            { speler2_id: user_id }
          ]
        },
        { uitgestelde_datum: null } // Alleen niet-uitgestelde games
      ]
    };
    
    // Voor normale gebruikers: alleen ongespeelde games
    // Voor admins: alle games (ook gespeelde)
    if (!isAdmin) {
      whereClause.AND.push({
        OR: [
          { result: null }, // Geen resultaat
          { result: "..." }, // Sevilla placeholder voor ongespeelde games
          { result: "not_played" } // Andere placeholder waarden
        ]
      });
    }
    
    const games = await prisma.game.findMany({
      where: whereClause,
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

    return games;
  } catch (error) {
    logger.error('Failed to get postponable games', { error, user_id, tournament_id });
    throw handleDBError(error);
  }
}

/**
 * Haal beschikbare inhaaldagen op voor een toernooi
 */
export async function getAvailableMakeupRounds(tournament_id: number, is_herfst: boolean): Promise<any[]> {
  try {
    logger.info('Getting available makeup rounds', { tournament_id, is_herfst });
    
    const makeupRounds = await prisma.round.findMany({
      where: {
        tournament_id: tournament_id,
        type: RoundType.MAKEUP,
        ronde_datum: {
          gte: new Date() // Alleen toekomstige inhaaldagen
        }
      },
      orderBy: {
        ronde_datum: 'asc'
      }
    });

    logger.info('Found makeup rounds in database', { 
      tournament_id, 
      is_herfst, 
      total_rounds: makeupRounds.length,
      rounds: makeupRounds.map(r => ({ id: r.round_id, date: r.ronde_datum, label: r.label }))
    });

    // Format dates to ISO strings for consistent frontend handling
    const formattedRounds = makeupRounds.map(round => {
      // Check if ronde_datum exists and is valid
      if (!round.ronde_datum) {
        logger.warn('Found makeup round without ronde_datum', { 
          round_id: round.round_id, 
          round: round 
        });
        return {
          ...round,
          ronde_datum: new Date().toISOString() // Fallback to current date
        };
      }
      
      return {
        ...round,
        ronde_datum: round.ronde_datum.toISOString()
      };
    });

    if (is_herfst) {
      // Voor herfst: alleen de eerstvolgende inhaaldag
      const result = formattedRounds.slice(0, 1);
      logger.info('Returning herfst rounds (first only)', { 
        count: result.length,
        rounds: result.map(r => ({ id: r.round_id, date: r.ronde_datum, label: r.label }))
      });
      return result;
    } else {
      // Voor lente: alle beschikbare inhaaldagen
      logger.info('Returning lente rounds (all)', { 
        count: formattedRounds.length,
        rounds: formattedRounds.map(r => ({ id: r.round_id, date: r.ronde_datum, label: r.label }))
      });
      return formattedRounds;
    }
  } catch (error) {
    logger.error('Failed to get available makeup rounds', { error, tournament_id, is_herfst });
    throw handleDBError(error);
  }
}

/**
 * Maak een uitgestelde game ongedaan - verplaats terug naar originele ronde
 * Validatie:
 * - Alleen de speler zelf kan zijn eigen uitgestelde game ongedaan maken
 * - Game moet in een inhaaldag staan (type MAKEUP)
 * - Originele game moet "uitgesteld" status hebben
 */
export async function undoPostponeGame(data: UndoPostponeGameData): Promise<UndoPostponeGameResponse> {
  try {
    logger.info('Starting undo postpone game process', { game_id: data.game_id, user_id: data.user_id });
    
    // 1. Haal de game op met alle relevante data
    const game = await prisma.game.findUnique({
      where: { game_id: data.game_id },
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

    if (!game) {
      throw ServiceError.notFound('Game niet gevonden');
    }

    logger.info('Game found for undo', { 
      game_id: game.game_id,
      speler1_id: game.speler1_id,
      speler2_id: game.speler2_id,
      round_type: game.round.type,
      result: game.result
    });

    // 2. Controleer of de gebruiker een van de spelers is
    if (game.speler1_id !== data.user_id && game.speler2_id !== data.user_id) {
      throw ServiceError.unauthorized('Je kunt alleen je eigen games ongedaan maken');
    }

    // 3. Controleer of de game in een inhaaldag staat
    if (game.round.type !== 'MAKEUP') {
      throw ServiceError.validationFailed('Deze game staat niet in een inhaaldag');
    }

    // 4. Zoek de originele game via original_game_id
    let originalGame;
    
    if ((game as any).original_game_id) {
      // Nieuwe methode: gebruik original_game_id
      originalGame = await prisma.game.findUnique({
        where: { game_id: (game as any).original_game_id },
        include: {
          round: true
        }
      });
    } else {
      // Fallback: zoek via spelers (oude methode)
      originalGame = await prisma.game.findFirst({
        where: {
          speler1_id: game.speler1_id,
          speler2_id: game.speler2_id,
          result: 'uitgesteld',
          round: {
            tournament_id: game.round.tournament_id,
            type: 'REGULAR'
          }
        },
        include: {
          round: true
        }
      });
    }

    if (!originalGame) {
      throw ServiceError.notFound('Originele uitgestelde game niet gevonden');
    }

    logger.info('Original game found', { 
      original_game_id: originalGame.game_id,
      original_round_id: originalGame.round_id,
      original_round_number: originalGame.round.ronde_nummer
    });

    // 5. Verwijder de game uit de inhaaldag
    await prisma.game.delete({
      where: { game_id: data.game_id }
    });

    logger.info('Game deleted from makeup round', { game_id: data.game_id });

    // 6. Herstel de originele game naar "Nog te spelen" status
    const restoredGame = await prisma.game.update({
      where: { game_id: originalGame.game_id },
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

    logger.info('Original game restored', { 
      original_game_id: restoredGame.game_id,
      result: restoredGame.result,
      uitgestelde_datum: restoredGame.uitgestelde_datum
    });

    logger.info('Undo postpone game completed successfully', {
      game_id: data.game_id,
      user_id: data.user_id,
      original_game_id: originalGame.game_id,
      restored_round_id: originalGame.round_id
    });

    return {
      success: true,
      message: `Uitstel ongedaan gemaakt. Game is teruggeplaatst naar ronde ${originalGame.round.ronde_nummer}`,
      original_game_id: originalGame.game_id,
      restored_round_id: originalGame.round_id
    };

  } catch (error) {
    // Eerst checken of error bestaat voordat we logging proberen
    if (!error) {
      logger.error('Error is undefined or null in undo postpone', { data });
      throw ServiceError.internalServerError('An unexpected error occurred during undo postpone');
    }
    
    // Veilige logging
    try {
      logger.error('Failed to undo postpone game', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        data,
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorCode: error instanceof Error ? (error as any).code : 'Unknown',
        errorType: typeof error
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
      console.error('Original error:', error);
    }
    
    // Als het al een ServiceError is, gooi deze direct door
    if (error instanceof ServiceError) {
      throw error;
    }
    
    // Anders, probeer het te transformeren via handleDBError
    try {
      throw handleDBError(error);
    } catch (transformedError) {
      // Als handleDBError ook faalt, gooi de originele error door met meer context
      try {
        logger.error('handleDBError also failed in undo postpone', { 
          originalError: error instanceof Error ? error.message : String(error),
          transformedError: transformedError instanceof Error ? transformedError.message : String(transformedError)
        });
      } catch (logError2) {
        console.error('Failed to log transformed error:', logError2);
      }
      throw ServiceError.internalServerError(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
