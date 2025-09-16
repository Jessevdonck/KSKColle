import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SevillaPlayer {
  Pos: number;
  ID: number;
  Name: string;
  SortName: string;
  PlayerID: string;
  Games: number;
  Wins: number;
  Draws: number;
  Losses: number;
  Score: number;
  Rating: number;
  IRtg: number;        // Initial rating
  Rtg_W_We: number;    // Rating change
  RatedGames: number;
  Game: SevillaGame[];
  Abs?: {
    Round: number;
    PlayerNr: number;
    Player: string;
    Reason: string;
    Score: number;
    PlainScore: number;
    Pos: number;
    OrgPos: number;
  }[];
}

interface SevillaGame {
  Round: number;
  Color: 'W' | 'B';
  ActualColor: 'W' | 'B';
  Opponent: number;
  White: string;
  Black: string;
  Res: string; // "1-0", "0-1", "1/2-1/2"
  Score: number;
  PlainScore: number;
  ExpScore: number;
  Pos: number;
  OrgPos: number;
  Venue: string;
  GameTime: string;
}

interface SevillaGroup {
  ID: number;
  Name: string;
  Ranking: {
    RankOrder: number;
    Round: number;
    Name: string;
    Date: string;
    Player: SevillaPlayer[];
  }[];
  History?: {
    RankOrder: number;
    Round: number;
    Name: string;
    Date: string;
    Player: SevillaPlayer[];
  }[];
}

interface SevillaTournament {
  Name: string;
  FileName: string;
  License: string;
  Site: string;
  GroupReport: SevillaGroup[];
}

export class SevillaImporterService {
  /**
   * Normalize player names to fix encoding issues and improve matching
   */
  private normalizeName(name: string): string {
    let normalized = name;
    
    // Handle specific corrupted names - only fix if they don't already have the correct é
    if (normalized.includes('Thomas Buys-Devill') && !normalized.includes('Thomas Buys-Devillé')) {
      normalized = 'Thomas Buys-Devillé';
    } else if (normalized.includes('Buys-Devill') && !normalized.includes('Buys-Devillé')) {
      normalized = normalized.replace('Buys-Devill', 'Buys-Devillé');
    } else if (normalized.includes('Devill') && !normalized.includes('Devillé')) {
      normalized = normalized.replace('Devill', 'Devillé');
    }
    
    // Handle Unicode replacement characters
    normalized = normalized.replace(/\uFFFD/g, 'é');
    
    return normalized;
  }

  async importTournament(sevillaData: SevillaTournament, tournamentName?: string, incremental: boolean = false): Promise<number> {
    try {
      // Get the main group (usually Group 1)
      const mainGroup = sevillaData.GroupReport.find(g => g.ID === 1);
      if (!mainGroup) {
        throw new Error('No main group found in Sevilla data');
      }

      // Get the latest ranking (final standings) for tournament info
      const latestRanking = mainGroup.Ranking[mainGroup.Ranking.length - 1];
      if (!latestRanking) {
        throw new Error('No ranking data found');
      }

      const tournamentNameToUse = tournamentName || sevillaData.Name;

      let tournament;
      
      if (incremental) {
        // Try to find existing tournament
        tournament = await prisma.tournament.findFirst({
          where: { 
            naam: tournamentNameToUse,
            finished: false // Only active tournaments
          },
          include: { rounds: true }
        });

        if (tournament) {
          console.log(`Found existing tournament: ${tournament.naam} (ID: ${tournament.tournament_id}) with ${tournament.rounds.length} rounds`);
          
          // Update tournament info if needed
          if (latestRanking.Round > tournament.rondes) {
            await prisma.tournament.update({
              where: { tournament_id: tournament.tournament_id },
              data: { rondes: latestRanking.Round }
            });
            console.log(`Updated tournament rounds from ${tournament.rondes} to ${latestRanking.Round}`);
          }
        } else {
          // Create new tournament if not found
          tournament = await prisma.tournament.create({
            data: {
              naam: tournamentNameToUse,
              rondes: latestRanking.Round,
              type: 'SWISS',
              rating_enabled: true,
              finished: false,
              is_youth: false,
            },
          });
          console.log(`Created new tournament: ${tournament.naam} (ID: ${tournament.tournament_id})`);
        }
      } else {
        // Original behavior - always create new tournament
        tournament = await prisma.tournament.create({
          data: {
            naam: tournamentNameToUse,
            rondes: latestRanking.Round,
            type: 'SWISS',
            rating_enabled: true,
            finished: false,
            is_youth: false,
          },
        });
        console.log(`Created tournament: ${tournament.naam} (ID: ${tournament.tournament_id})`);
      }

      // Import players from the History section (which contains all players with games)
      const historySection = mainGroup.History || [];
      if (historySection.length > 0) {
        // Get all players from the first history entry (they should all have the same games)
        const playersWithGames = historySection[0]?.Player || [];
        console.log(`About to import players and games from ${playersWithGames.length} players with games`);
        console.log(`First few players with games:`, playersWithGames.slice(0, 3).map(p => ({ id: p.ID, name: p.Name, hasGame: !!p.Game, gameLength: p.Game?.length || 0 })));
        
        // Import players from the History section
        const playerMap = await this.importPlayers(playersWithGames, tournament.tournament_id, incremental);
        
        // Import rounds and games
        await this.importRoundsAndGames(playersWithGames, tournament.tournament_id, playerMap, incremental, sevillaData);
      } else {
        console.log('No history section found, using ranking section');
        // Fallback to ranking section if no history
        await this.importPlayers(latestRanking.Player, tournament.tournament_id, incremental);
      }

      console.log(`Successfully imported tournament with ${latestRanking.Player.length} players and ${latestRanking.Round} rounds`);
      
      return tournament.tournament_id;
    } catch (error) {
      console.error('Error importing Sevilla tournament:', error);
      throw error;
    }
  }

  private async importPlayers(players: SevillaPlayer[], tournamentId: number, _incremental: boolean = false): Promise<Map<number, number>> {
    const playerMap = new Map<number, number>();
    const processedSevillaIds = new Set<number>(); // Track processed players by Sevilla ID to avoid duplicates
    let skippedCount = 0;

    for (const sevillaPlayer of players) {
      // Fix encoding issues and normalize name
      const normalizedName = this.normalizeName(sevillaPlayer.Name);
      
      // Check if we've already processed this player (by Sevilla ID, not name)
      if (processedSevillaIds.has(sevillaPlayer.ID)) {
        console.log(`Skipping duplicate player by ID: "${sevillaPlayer.Name}" (Sevilla ID: ${sevillaPlayer.ID})`);
        continue;
      }
      processedSevillaIds.add(sevillaPlayer.ID);
      
      // Parse name into first and last name
      const nameParts = normalizedName.split(' ');
      const voornaam = nameParts[0] || 'Unknown';
      const achternaam = nameParts.slice(1).join(' ') || 'Unknown';

      console.log(`Processing player: "${sevillaPlayer.Name}" -> normalized: "${normalizedName}" -> "${voornaam}" "${achternaam}"`);

      // Try to find existing user by name or create new one
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { 
              AND: [
                { voornaam: voornaam },
                { achternaam: achternaam }
              ]
            },
            { email: sevillaPlayer.PlayerID && sevillaPlayer.PlayerID.includes('@') ? sevillaPlayer.PlayerID : `${sevillaPlayer.PlayerID || `sevilla_${sevillaPlayer.ID}`}@kskcolle.be` },
          ],
        },
      });

      // Check if this user is already mapped to another Sevilla player
      const existingMapping = Array.from(playerMap.entries()).find(([_, userId]) => userId === user?.user_id);
      if (existingMapping && existingMapping[0] !== sevillaPlayer.ID) {
        console.log(`User ${user?.voornaam} ${user?.achternaam} is already mapped to Sevilla ID ${existingMapping[0]}, skipping Sevilla ID ${sevillaPlayer.ID}`);
        continue; // Skip this player
      }

      if (!user) {
        // Create new user if they don't exist in the database
        console.log(`Creating new user for player "${sevillaPlayer.Name}"`);
        
        // Generate a unique email for this player
        const email = `${sevillaPlayer.PlayerID || `sevilla_${sevillaPlayer.ID}`}@kskcolle.be`;
        
        user = await prisma.user.create({
          data: {
            voornaam: voornaam,
            achternaam: achternaam,
            email: email,
            tel_nummer: "000000000", // Default phone number for imported users
            schaakrating_elo: sevillaPlayer.Rating || 1200,
            schaakrating_difference: sevillaPlayer.Rtg_W_We || 0,
            lid_sinds: new Date(),
            password_hash: "imported_user", // Placeholder for imported users
            roles: JSON.stringify(['USER']),
          },
        });
        
        console.log(`Created new user: ${user.voornaam} ${user.achternaam} (Sevilla ID: ${sevillaPlayer.ID} -> Database ID: ${user.user_id})`);
      } else {
        // Update rating if it's different
        console.log(`Found existing user: ${user.voornaam} ${user.achternaam} (Sevilla ID: ${sevillaPlayer.ID} -> Database ID: ${user.user_id})`);
        if (sevillaPlayer.Rating && sevillaPlayer.Rating !== user.schaakrating_elo) {
          await prisma.user.update({
            where: { user_id: user.user_id },
            data: { 
              schaakrating_elo: sevillaPlayer.Rating,
              schaakrating_difference: sevillaPlayer.Rtg_W_We || 0, // Rating change
            },
          });
          console.log(`Updated rating for ${user.voornaam} ${user.achternaam}: ${user.schaakrating_elo} -> ${sevillaPlayer.Rating} (change: ${sevillaPlayer.Rtg_W_We || 0})`);
        }
      }

      // Check if participation already exists
      const existingParticipation = await prisma.participation.findUnique({
        where: {
          user_id_tournament_id: {
            user_id: user.user_id,
            tournament_id: tournamentId
          }
        }
      });

      if (!existingParticipation) {
        // Create participation (store Sevilla rating data in existing fields for now)
        await prisma.participation.create({
          data: {
            user_id: user.user_id,
            tournament_id: tournamentId,
            score: sevillaPlayer.Score,
            bye_round: null,
            // Store Sevilla rating data in existing fields temporarily
            buchholz: sevillaPlayer.IRtg, // Initial rating
            sonnebornBerger: sevillaPlayer.Rating, // Final rating  
            tie_break: sevillaPlayer.Rtg_W_We, // Rating change
          },
        });
        console.log(`Created participation for ${user.voornaam} ${user.achternaam} in tournament ${tournamentId}`);
      } else {
        // Update existing participation with latest score and rating data
        await prisma.participation.update({
          where: {
            user_id_tournament_id: {
              user_id: user.user_id,
              tournament_id: tournamentId
            }
          },
          data: {
            score: sevillaPlayer.Score,
            buchholz: sevillaPlayer.IRtg, // Initial rating
            sonnebornBerger: sevillaPlayer.Rating, // Final rating  
            tie_break: sevillaPlayer.Rtg_W_We, // Rating change
          },
        });
        console.log(`Updated participation for ${user.voornaam} ${user.achternaam} in tournament ${tournamentId}`);
      }

      playerMap.set(sevillaPlayer.ID, user.user_id);
    }

    console.log(`Player import summary: ${playerMap.size} players found and mapped, ${skippedCount} players skipped (not found in database)`);
    return playerMap;
  }



  private async importRoundsAndGames(players: SevillaPlayer[], tournamentId: number, playerMap: Map<number, number>, incremental: boolean = false, sevillaData?: SevillaTournament) {
    console.log(`=== importRoundsAndGames called with ${players.length} players (incremental: ${incremental}) ===`);
    
    // Parse round dates from Sevilla data if available
    const roundDates = new Map<number, Date>();
    if (sevillaData) {
      const mainGroup = sevillaData.GroupReport.find(g => g.ID === 1);
      if (mainGroup && mainGroup.Ranking) {
        // Look through all ranking entries to find round dates
        mainGroup.Ranking.forEach(ranking => {
          if (ranking.Date && ranking.Round) {
            // Parse date from format "18/09/2025" or "18-9-2025"
            let dateParts: string[] = [];
            if (ranking.Date.includes('/')) {
              dateParts = ranking.Date.split('/');
            } else if (ranking.Date.includes('-')) {
              dateParts = ranking.Date.split('-');
            }
            
            if (dateParts.length === 3) {
              const day = dateParts[0] as string;
              const month = dateParts[1] as string;
              const year = dateParts[2] as string;
              
              if (day && month && year) {
                // Create date in local timezone to avoid timezone issues
                const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
                roundDates.set(ranking.Round, date);
                console.log(`Parsed round ${ranking.Round} date: ${ranking.Date} -> ${date.toISOString()}`);
              }
            }
          }
        });
        
        // Also check History section for additional round dates
        if (mainGroup.History) {
          mainGroup.History.forEach(history => {
            if (history.Date && history.Round) {
              // Parse date from format "18/09/2025" or "18-9-2025"
              let dateParts: string[] = [];
              if (history.Date.includes('/')) {
                dateParts = history.Date.split('/');
              } else if (history.Date.includes('-')) {
                dateParts = history.Date.split('-');
              }
              
              if (dateParts.length === 3) {
                const day = dateParts[0] as string;
                const month = dateParts[1] as string;
                const year = dateParts[2] as string;
                
                if (day && month && year) {
                  // Create date in local timezone to avoid timezone issues
                  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
                  // Only set if we don't already have this round date
                  if (!roundDates.has(history.Round)) {
                    roundDates.set(history.Round, date);
                    console.log(`Parsed round ${history.Round} date from history: ${history.Date} -> ${date.toISOString()}`);
                  }
                }
              }
            }
          });
        }
      }
    }
    
    // Determine tournament start date from Sevilla data or use fallback
    let tournamentStartDate = new Date('2024-09-15'); // Fallback
    if (roundDates.size > 0) {
      // Use the earliest round date as tournament start date
      const earliestRound = Math.min(...Array.from(roundDates.keys()));
      tournamentStartDate = roundDates.get(earliestRound) || new Date('2024-09-15');
      console.log(`Using tournament start date from Sevilla data: ${tournamentStartDate.toISOString()}`);
    }
    
    // Debug: show first few players
    console.log(`First 3 players:`, players.slice(0, 3).map(p => ({ name: p.Name, hasGame: !!p.Game, gameLength: p.Game?.length || 0 })));
    
    // Get all unique rounds from all players
    const allRounds = new Set<number>();
    players.forEach(player => {
      if (player.Game && Array.isArray(player.Game)) {
        console.log(`Player ${player.Name} has ${player.Game.length} games`);
        player.Game.forEach(game => {
          allRounds.add(game.Round);
        });
      } else {
        console.log(`Player ${player.Name} has no games or games is not an array`);
      }
    });

    const sortedRounds = Array.from(allRounds).sort((a, b) => a - b);
    console.log(`Found ${sortedRounds.length} unique rounds: ${sortedRounds.join(', ')}`);
    
    // Also check for absent players with scores (they might not have games but have scores)
    const playersWithScores = players.filter(p => p.Score > 0);
    console.log(`Found ${playersWithScores.length} players with scores > 0`);

    // Get existing rounds to understand the current structure
    const existingRounds = await prisma.round.findMany({
      where: { tournament_id: tournamentId },
      orderBy: { ronde_nummer: 'asc' },
      select: {
        round_id: true,
        ronde_nummer: true,
        type: true
      }
    });

    console.log(`Existing rounds in tournament: ${existingRounds.map(r => `${r.ronde_nummer}(${r.type || 'REGULAR'})`).join(', ')}`);

    for (const roundNumber of sortedRounds) {
      let round;
      
      // Gebruik de echte datum uit Sevilla data of fallback naar berekende datum
      let roundDate: Date;
      if (roundDates.has(roundNumber)) {
        roundDate = roundDates.get(roundNumber)!;
        console.log(`Using Sevilla date for round ${roundNumber}: ${roundDate.toISOString()}`);
      } else {
        // Fallback: bereken de datum (startdatum + (ronde-1) weken)
        roundDate = new Date(tournamentStartDate);
        roundDate.setDate(roundDate.getDate() + (roundNumber - 1) * 7);
        console.log(`Using calculated date for round ${roundNumber}: ${roundDate.toISOString()}`);
      }
      
      if (incremental) {
        // Check if round exists
        const existingRound = await prisma.round.findFirst({
          where: { 
            tournament_id: tournamentId,
            ronde_nummer: roundNumber 
          }
        });
        
        if (existingRound) {
          console.log(`Round ${roundNumber} exists, checking for updates...`);
          round = existingRound;
          
          // Check if round date needs to be updated
          const existingDate = existingRound.ronde_datum ? new Date(existingRound.ronde_datum) : null;
          const needsDateUpdate = !existingDate || 
            (roundDates.has(roundNumber) && 
             Math.abs(existingDate.getTime() - roundDate.getTime()) > 0); // Any difference
          
          // Check if startuur needs to be set (default to 20:00 if not set)
          const needsStartuurUpdate = !existingRound.startuur;
          const defaultStartuur = '20:00';
          
          if (needsDateUpdate || needsStartuurUpdate) {
            const updateData: any = {};
            
            if (needsDateUpdate) {
              updateData.ronde_datum = roundDate;
              console.log(`Updating round ${roundNumber} date from ${existingDate?.toISOString()} to ${roundDate.toISOString()}`);
            }
            
            if (needsStartuurUpdate) {
              updateData.startuur = defaultStartuur;
              console.log(`Setting round ${roundNumber} startuur to ${defaultStartuur}`);
            }
            
            await prisma.round.update({
              where: { round_id: existingRound.round_id },
              data: updateData
            });
            
            if (needsDateUpdate) console.log(`Updated round ${roundNumber} date`);
            if (needsStartuurUpdate) console.log(`Updated round ${roundNumber} startuur`);
          } else {
            console.log(`Round ${roundNumber} date and startuur are up to date`);
          }
          
          // Only delete games that are not postponed (don't have uitgestelde_datum)
          await prisma.game.deleteMany({
            where: { 
              round_id: existingRound.round_id,
              uitgestelde_datum: null // Only delete non-postponed games
            }
          });
          console.log(`Deleted non-postponed games for round ${roundNumber}`);
          
          // Ensure postponed games maintain their status
          await this.preservePostponedGames(existingRound.round_id);
        } else {
          // Create new round - determine the correct round number considering makeup days
          const correctRoundNumber = await this.determineCorrectRoundNumber(tournamentId, roundNumber, existingRounds);
          
          round = await prisma.round.create({
            data: {
              tournament_id: tournamentId,
              ronde_nummer: correctRoundNumber,
              ronde_datum: roundDate, // Use calculated date
              startuur: '20:00', // Default start time
              type: 'REGULAR', // Sevilla rounds are always regular rounds
              is_sevilla_imported: true, // Mark as Sevilla imported
            },
          });
          console.log(`Created new round ${roundNumber} with correct number ${correctRoundNumber} and ID ${round.round_id}`);
        }
      } else {
        // Original behavior - always create new round
        round = await prisma.round.create({
          data: {
            tournament_id: tournamentId,
            ronde_nummer: roundNumber,
            ronde_datum: roundDate, // Use calculated date
            startuur: '20:00', // Default start time
            type: 'REGULAR', // Sevilla rounds are always regular rounds
            is_sevilla_imported: true, // Mark as Sevilla imported
          },
        });
        console.log(`Created round ${roundNumber} with ID ${round.round_id}`);
      }

      // Import games for this round
      await this.importGamesForRound(players, round.round_id, roundNumber, playerMap);
      
      // Import absent players with scores for this round
      await this.importAbsentPlayers(players, round.round_id, roundNumber, playerMap);
    }
  }

  /**
   * Behoud de status van uitgestelde games tijdens incrementele import
   */
  private async preservePostponedGames(roundId: number): Promise<void> {
    try {
      // Haal de ronde op om tournament_id te krijgen
      const round = await prisma.round.findUnique({
        where: { round_id: roundId },
        select: { tournament_id: true }
      });

      if (!round) return;

      // Haal alle uitgestelde games op voor deze ronde
      const postponedGames = await prisma.game.findMany({
        where: {
          round_id: roundId,
          uitgestelde_datum: { not: null }
        }
      });

      console.log(`Found ${postponedGames.length} postponed games to preserve`);

      for (const game of postponedGames) {
        // Controleer of er een inhaaldag ronde bestaat voor deze datum
        const makeupRound = await prisma.round.findFirst({
          where: {
            tournament_id: round.tournament_id,
            type: 'MAKEUP',
            ronde_datum: game.uitgestelde_datum
          }
        });

        if (makeupRound) {
          // Controleer of er al een game bestaat in de inhaaldag ronde
          const existingMakeupGame = await prisma.game.findFirst({
            where: {
              round_id: makeupRound.round_id,
              speler1_id: game.speler1_id,
              speler2_id: game.speler2_id
            }
          });

          if (!existingMakeupGame) {
            // Maak een game aan in de inhaaldag ronde (zonder resultaat)
            await prisma.game.create({
              data: {
                round_id: makeupRound.round_id,
                speler1_id: game.speler1_id,
                speler2_id: game.speler2_id,
                winnaar_id: null,
                result: null
              }
            });
            console.log(`Created placeholder game in makeup round for postponed game ${game.game_id}`);
          }
        }
      }
    } catch (error) {
      console.error('Error preserving postponed games:', error);
    }
  }

  /**
   * Synchroniseer een uitgestelde game naar de inhaaldag ronde
   */
  private async syncPostponedGameToMakeupRound(originalGameId: number, result: string, winnaarId: number | null): Promise<void> {
    try {
      // Haal de originele game op
      const originalGame = await prisma.game.findUnique({
        where: { game_id: originalGameId },
        include: { round: true }
      });

      if (!originalGame || !originalGame.uitgestelde_datum) {
        return; // Geen uitgestelde game
      }

      // Zoek de inhaaldag ronde voor deze datum
      const makeupRound = await prisma.round.findFirst({
        where: {
          tournament_id: originalGame.round.tournament_id,
          type: 'MAKEUP',
          ronde_datum: originalGame.uitgestelde_datum
        }
      });

      if (!makeupRound) {
        console.log(`No makeup round found for date ${originalGame.uitgestelde_datum}`);
        return;
      }

      // Zoek of er al een game bestaat in de inhaaldag ronde
      const existingMakeupGame = await prisma.game.findFirst({
        where: {
          round_id: makeupRound.round_id,
          speler1_id: originalGame.speler1_id,
          speler2_id: originalGame.speler2_id
        }
      });

      if (existingMakeupGame) {
        // Update de bestaande inhaaldag game
        await prisma.game.update({
          where: { game_id: existingMakeupGame.game_id },
          data: {
            winnaar_id: winnaarId,
            result: result
          }
        });
        console.log(`Updated makeup round game ${existingMakeupGame.game_id} with result ${result}`);
      } else {
        // Maak een nieuwe game aan in de inhaaldag ronde
        await prisma.game.create({
          data: {
            round_id: makeupRound.round_id,
            speler1_id: originalGame.speler1_id,
            speler2_id: originalGame.speler2_id,
            winnaar_id: winnaarId,
            result: result
          }
        });
        console.log(`Created new makeup round game with result ${result}`);
      }
    } catch (error) {
      console.error('Error syncing postponed game to makeup round:', error);
    }
  }

  /**
   * Bepaal het juiste ronde nummer rekening houdend met inhaaldagen
   */
  private async determineCorrectRoundNumber(_tournamentId: number, sevillaRoundNumber: number, existingRounds: any[]): Promise<number> {
    // Als er geen bestaande rondes zijn, gebruik het Sevilla ronde nummer
    if (existingRounds.length === 0) {
      return sevillaRoundNumber;
    }

    // Zoek de laatste ronde die voor of op sevillaRoundNumber komt
    const regularRounds = existingRounds.filter(r => r.type === 'REGULAR');
    const lastRegularRound = regularRounds.find(r => r.ronde_nummer === sevillaRoundNumber);
    
    if (lastRegularRound) {
      // Deze ronde bestaat al, gebruik het bestaande nummer
      return lastRegularRound.ronde_nummer;
    }

    // Zoek de laatste ronde die voor sevillaRoundNumber komt
    const previousRegularRounds = regularRounds.filter(r => r.ronde_nummer < sevillaRoundNumber);
    if (previousRegularRounds.length === 0) {
      // Geen vorige rondes, gebruik sevillaRoundNumber
      return sevillaRoundNumber;
    }

    const lastPreviousRound = Math.max(...previousRegularRounds.map(r => r.ronde_nummer));
    
    // Tel alle rondes (regulier + inhaaldagen) die na lastPreviousRound komen
    const roundsAfterLast = existingRounds.filter(r => r.ronde_nummer > lastPreviousRound);
    
    // Het juiste nummer is lastPreviousRound + 1 + aantal inhaaldagen ertussen
    return lastPreviousRound + 1 + roundsAfterLast.length;
  }

  private async importGamesForRound(players: SevillaPlayer[], roundId: number, roundNumber: number, playerMap: Map<number, number>) {
    const gamesInRound = new Set<string>(); // To avoid duplicates
    let gamesFound = 0;

    for (const player of players) {
      if (!player.Game || !Array.isArray(player.Game)) {
        console.log(`Player ${player.Name} has no Game array or Game is not an array`);
        continue;
      }
      
      // Debug: show all games for this player
      const allRounds = player.Game.map(g => g.Round).sort((a, b) => a - b);
      console.log(`Player ${player.Name} has ${player.Game.length} games in rounds: ${allRounds.join(', ')}`);
      
      const playerGame = player.Game.find(g => g.Round === roundNumber);
      if (!playerGame) {
        console.log(`Player ${player.Name} has no game in round ${roundNumber}`);
        continue;
      }
      
      gamesFound++;

      const playerUserId = playerMap.get(player.ID);
      const opponentUserId = playerMap.get(playerGame.Opponent);
      
      if (!playerUserId || !opponentUserId) {
        console.warn(`Could not find user IDs for game: ${player.ID} vs ${playerGame.Opponent}`);
        continue;
      }

      // Create unique game identifier to avoid duplicates
      const gameId = `${Math.min(playerUserId, opponentUserId)}-${Math.max(playerUserId, opponentUserId)}`;
      
      if (gamesInRound.has(gameId)) continue;
      gamesInRound.add(gameId);

      // Determine winner and result first
      let winnaarId: number | null = null;
      let result: string = playerGame.Res;
      
      // Find who played white and black based on the White/Black fields
      const whitePlayerName = playerGame.White;
      const blackPlayerName = playerGame.Black;
      
      // Find the Sevilla player objects
      const whiteSevillaPlayer = players.find(p => p.Name === whitePlayerName);
      const blackSevillaPlayer = players.find(p => p.Name === blackPlayerName);
      
      // Determine who is white and who is black in our database
      const whitePlayerId = whiteSevillaPlayer ? playerMap.get(whiteSevillaPlayer.ID) || null : null;
      const blackPlayerId = blackSevillaPlayer ? playerMap.get(blackSevillaPlayer.ID) || null : null;
      
      console.log(`Game: ${whitePlayerName}(${whiteSevillaPlayer?.ID}->${whitePlayerId}) vs ${blackPlayerName}(${blackSevillaPlayer?.ID}->${blackPlayerId})`);
      
      // The result is always from white's perspective: "1-0" = white wins, "0-1" = black wins, "1/2-1/2" = draw
      if (playerGame.Res === '1-0') {
        // White wins
        winnaarId = whitePlayerId;
      } else if (playerGame.Res === '0-1') {
        // Black wins
        winnaarId = blackPlayerId;
      } else if (playerGame.Res === '1/2-1/2') {
        winnaarId = null; // Draw
      } else {
        // Handle other results or incomplete games
        winnaarId = null;
        result = playerGame.Res || '0-0';
      }

      // Check if this game already exists (for postponed games)
      const existingGame = await prisma.game.findFirst({
        where: {
          round_id: roundId,
          speler1_id: whitePlayerId || playerUserId,
          speler2_id: blackPlayerId || opponentUserId,
        }
      });

      if (existingGame) {
        console.log(`Game already exists, updating result: ${existingGame.game_id}`);
        // Update the existing game with the new result, but preserve uitgestelde_datum
        await prisma.game.update({
          where: { game_id: existingGame.game_id },
          data: {
            winnaar_id: winnaarId,
            result: result,
            // Don't update uitgestelde_datum - preserve it if it exists
          }
        });
        
        // If this game was postponed and now has a result, sync it to the makeup round
        if (existingGame.uitgestelde_datum && result && result !== '0-0' && result !== '...') {
          await this.syncPostponedGameToMakeupRound(existingGame.game_id, result, winnaarId);
        }
        
        continue;
      }

      // Create game - use the actual players who played (white and black)
      await prisma.game.create({
        data: {
          round_id: roundId,
          speler1_id: whitePlayerId || playerUserId, // Use white player as speler1, fallback to original logic
          speler2_id: blackPlayerId || opponentUserId, // Use black player as speler2, fallback to original logic
          winnaar_id: winnaarId,
          result: result,
        },
      });
      
      console.log(`Created game: speler1=${whitePlayerId || playerUserId} vs speler2=${blackPlayerId || opponentUserId} (${playerGame.Res}) - White: ${whitePlayerName}(${whitePlayerId}), Black: ${blackPlayerName}(${blackPlayerId}), Winner: ${winnaarId || 'Draw'}`);
    }
    
    console.log(`Round ${roundNumber}: Found ${gamesFound} games, created ${gamesInRound.size} unique games`);
  }

  /**
   * Import absent players who have scores but no games (bye games)
   * This handles players with "Abs with msg" who get 0.5 points
   */
  private async importAbsentPlayers(players: SevillaPlayer[], roundId: number, roundNumber: number, playerMap: Map<number, number>) {
    console.log(`=== importAbsentPlayers for round ${roundNumber} ===`);
    
    for (const player of players) {
      // Check if player has a game in this round
      const hasGameInRound = player.Game && player.Game.some(g => g.Round === roundNumber);
      
      if (!hasGameInRound) {
        const playerUserId = playerMap.get(player.ID);
        if (!playerUserId) {
          console.warn(`Could not find user ID for absent player: ${player.ID}`);
          continue;
        }
        
        // Check if this player already has a game in this round
        const existingGame = await prisma.game.findFirst({
          where: {
            round_id: roundId,
            OR: [
              { speler1_id: playerUserId },
              { speler2_id: playerUserId }
            ]
          }
        });
        
        if (existingGame) {
          console.log(`Player ${player.Name} already has a game in round ${roundNumber}, skipping`);
          continue;
        }
        
        // Check if player has an Abs entry for this round (indicating they were absent with message)
        const hasAbsEntry = player.Abs && player.Abs.some((abs: any) => abs.Round === roundNumber);
        
        if (hasAbsEntry && player.Abs) {
          const absEntry = player.Abs.find((abs: any) => abs.Round === roundNumber);
          const absScore = absEntry?.Score || 0;
          const reason = absEntry?.Reason || "";
          
          console.log(`Creating absent game for player: ${player.Name} (Reason: ${reason}, Score: ${absScore})`);
          
          // Determine result based on reason and score
          let result: string;
          let winnaarId: number | null = null;
          
          if (reason === "Pairing alloc bye") {
            // Bye - player gets the score as points
            result = `${absScore}-0`;
            if (absScore > 0) {
              winnaarId = playerUserId; // Player wins the bye
            }
          } else if (reason === "Abs with msg") {
            // Absent with message - use special result format to distinguish from bye
            result = `ABS-${absScore}`;
            if (absScore > 0) {
              winnaarId = playerUserId; // Player gets the points
            }
          } else {
            // Unknown reason, default to 0 points
            result = "0-0";
          }
          
          // Create a game for this absent player
          await prisma.game.create({
            data: {
              round_id: roundId,
              speler1_id: playerUserId,
              speler2_id: null, // No opponent for absent player
              winnaar_id: winnaarId,
              result: result,
            },
          });
          
          console.log(`Created absent game for player: ${player.Name} (ID: ${player.ID}) in round ${roundNumber} - ${reason} - ${result}`);
        }
      }
    }
  }

  async validateSevillaData(data: any): Promise<boolean> {
    try {
      // Basic validation
      if (!data.Name || !data.GroupReport || !Array.isArray(data.GroupReport)) {
        return false;
      }

      const mainGroup = data.GroupReport.find((g: any) => g.ID === 1);
      if (!mainGroup || !mainGroup.Ranking || !Array.isArray(mainGroup.Ranking)) {
        return false;
      }

      const latestRanking = mainGroup.Ranking[mainGroup.Ranking.length - 1];
      if (!latestRanking || !latestRanking.Player || !Array.isArray(latestRanking.Player)) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating Sevilla data:', error);
      return false;
    }
  }
}

