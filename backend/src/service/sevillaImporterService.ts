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
  RtgDif: number;      // Rating difference
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
  RoundHist?: {
    ID: number;
    Name: string;
    Date: string;
    Game: SevillaGame[];
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

      // Always update participations with latest rating data, even for incremental imports
      console.log('🔄 Updating participations with latest rating data...');
      await this.importPlayers(latestRanking.Player, tournament.tournament_id, incremental);

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
        
        // Don't generate fake emails - leave email empty for imported users
        // Admins can add proper email addresses later if needed
        user = await prisma.user.create({
          data: {
            voornaam: voornaam,
            achternaam: achternaam,
            email: null, // No fake email - leave it empty
            tel_nummer: null, // No fake phone number either
            schaakrating_elo: sevillaPlayer.Rating || 1200,
            schaakrating_difference: sevillaPlayer.RtgDif || 0,
            lid_sinds: new Date(),
            password_hash: "imported_user", // Placeholder for imported users
            roles: JSON.stringify(['user']),
          },
        });
        
        console.log(`Created new user: ${user.voornaam} ${user.achternaam} (Sevilla ID: ${sevillaPlayer.ID} -> Database ID: ${user.user_id})`);
      } else {
        // User exists - no rating update during import
        console.log(`Found existing user: ${user.voornaam} ${user.achternaam} (Sevilla ID: ${sevillaPlayer.ID} -> Database ID: ${user.user_id})`);
        // Note: Rating updates are only done when tournament is closed, not during import
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

      console.log(`🔍 Processing ${user.voornaam} ${user.achternaam}: RtgDif=${sevillaPlayer.RtgDif}, IRtg=${sevillaPlayer.IRtg}, Rating=${sevillaPlayer.Rating}`);

      if (!existingParticipation) {
        // Create participation (store Sevilla rating data in dedicated fields)
        await prisma.participation.create({
          data: {
            user_id: user.user_id,
            tournament_id: tournamentId,
            score: sevillaPlayer.Score,
            bye_round: null,
            // Store Sevilla rating data in dedicated fields
            sevilla_initial_rating: sevillaPlayer.IRtg, // Initial rating
            sevilla_final_rating: sevillaPlayer.Rating, // Final rating  
            sevilla_rating_change: sevillaPlayer.RtgDif, // Rating difference from Sevilla
          },
        });
        console.log(`Created participation for ${user.voornaam} ${user.achternaam} in tournament ${tournamentId} with RtgDif=${sevillaPlayer.RtgDif}`);
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
            sevilla_initial_rating: sevillaPlayer.IRtg, // Initial rating
            sevilla_final_rating: sevillaPlayer.Rating, // Final rating  
            sevilla_rating_change: sevillaPlayer.RtgDif, // Rating difference from Sevilla
          },
        });
        console.log(`Updated participation for ${user.voornaam} ${user.achternaam} in tournament ${tournamentId} with RtgDif=${sevillaPlayer.RtgDif}`);
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
            // Only set if we don't already have this round date (first occurrence wins)
            if (!roundDates.has(ranking.Round)) {
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
                  console.log(`✅ Set round ${ranking.Round} date: ${ranking.Date} -> ${date.toISOString()}`);
                }
              }
            }
          }
        });
        
        // Also check RoundHist section for additional round dates
        if (mainGroup.RoundHist) {
          mainGroup.RoundHist.forEach(roundHist => {
            if (roundHist.Date && roundHist.ID) {
              // Only set if we don't already have this round date
              if (!roundDates.has(roundHist.ID)) {
                // Parse date from format "18/09/2025" or "18-9-2025"
                let dateParts: string[] = [];
                if (roundHist.Date.includes('/')) {
                  dateParts = roundHist.Date.split('/');
                } else if (roundHist.Date.includes('-')) {
                  dateParts = roundHist.Date.split('-');
                }
                
                if (dateParts.length === 3) {
                  const day = dateParts[0] as string;
                  const month = dateParts[1] as string;
                  const year = dateParts[2] as string;
                  
                  if (day && month && year) {
                    // Create date in local timezone to avoid timezone issues
                    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
                    roundDates.set(roundHist.ID, date);
                    console.log(`✅ Set round ${roundHist.ID} date from RoundHist: ${roundHist.Date} -> ${date.toISOString()}`);
                  }
                }
              }
            }
          });
        }
        
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
    
    // Calculate fallback dates for rounds without Sevilla dates
    const calculateFallbackDate = (roundNumber: number): Date => {
      if (roundDates.has(roundNumber)) {
        return roundDates.get(roundNumber)!;
      }
      
      // If we have other round dates, calculate based on them
      if (roundDates.size > 0) {
        const earliestRound = Math.min(...Array.from(roundDates.keys()));
        const earliestDate = roundDates.get(earliestRound)!;
        const daysBetweenRounds = 7; // Assume 1 week between rounds
        const roundsDifference = roundNumber - earliestRound;
        const fallbackDate = new Date(earliestDate);
        fallbackDate.setDate(fallbackDate.getDate() + (roundsDifference * daysBetweenRounds));
        console.log(`📅 Calculated fallback date for round ${roundNumber}: ${fallbackDate.toISOString()}`);
        return fallbackDate;
      }
      
      // Ultimate fallback: use tournament start date + round offset
      const fallbackDate = new Date(tournamentStartDate);
      fallbackDate.setDate(fallbackDate.getDate() + ((roundNumber - 1) * 7));
      console.log(`📅 Ultimate fallback date for round ${roundNumber}: ${fallbackDate.toISOString()}`);
      return fallbackDate;
    };
    
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
      roundDate = calculateFallbackDate(roundNumber);
      
      if (incremental) {
        // For incremental import, we need to find the correct existing round
        // Since Sevilla rounds might have different ronde_nummer due to makeup days,
        // we'll look for Sevilla rounds and match them by their import order
        
        const allSevillaRounds = await prisma.round.findMany({
          where: { 
            tournament_id: tournamentId,
            is_sevilla_imported: true
          },
          orderBy: { ronde_nummer: 'asc' }
        });
        
        // Find the round that corresponds to this Sevilla round number
        // We'll match by the order in which Sevilla rounds were imported
        const sortedSevillaRounds = Array.from(allRounds).sort((a, b) => a - b);
        const sevillaRoundIndex = sortedSevillaRounds.indexOf(roundNumber);
        const existingRound = sevillaRoundIndex >= 0 && sevillaRoundIndex < allSevillaRounds.length 
          ? allSevillaRounds[sevillaRoundIndex] 
          : null;
        
        if (existingRound) {
          console.log(`Found existing Sevilla round ${roundNumber} with ID ${existingRound.round_id} and ronde_nummer ${existingRound.ronde_nummer}`);
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
        // Use correct round numbering for all imports
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
        console.log(`Created round ${roundNumber} with correct number ${correctRoundNumber} and ID ${round.round_id}`);
      }

      // Import games for this round
      await this.importGamesForRound(players, round.round_id, roundNumber, playerMap);
      
      // Import absent players with scores for this round
      await this.importAbsentPlayers(players, round.round_id, roundNumber, playerMap);
    }
  }

  /**
   * Bepaal het juiste ronde nummer rekening houdend met inhaaldagen
   * Voor Sevilla imports: behoud de originele Sevilla ronde nummering
   */
  private async determineCorrectRoundNumber(_tournamentId: number, sevillaRoundNumber: number, existingRounds: any[]): Promise<number> {
    // Voor Sevilla imports, probeer altijd de originele Sevilla ronde nummer te behouden
    // Dit zorgt ervoor dat ronde 2 altijd ronde 2 blijft, ongeacht inhaaldagen
    
    // Check of er al een ronde bestaat met dit nummer
    const existingRoundWithNumber = existingRounds.find(r => r.ronde_nummer === sevillaRoundNumber);
    
    if (existingRoundWithNumber) {
      // Als het een Sevilla ronde is, gebruik het bestaande nummer
      if (existingRoundWithNumber.is_sevilla_imported) {
        return sevillaRoundNumber;
      }
      
      // Als het een niet-Sevilla ronde is, zoek het volgende beschikbare nummer
      const maxRegularRound = Math.max(...existingRounds.filter(r => r.type === 'REGULAR').map(r => r.ronde_nummer));
      return maxRegularRound + 1;
    }
    
    // Geen conflict, gebruik het Sevilla ronde nummer
    return sevillaRoundNumber;
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
        
        // Check if there's a postponed game with the same players in this tournament
        const round = await prisma.round.findUnique({
          where: { round_id: roundId },
          select: { tournament_id: true }
        });
        
        if (round) {
          const player1 = whitePlayerId || playerUserId;
          const player2 = blackPlayerId || opponentUserId;
          
          // Only search for postponed games if both players exist
          const postponedGame = player1 && player2 ? await prisma.game.findFirst({
            where: {
              round: { tournament_id: round.tournament_id },
              OR: [
                {
                  speler1_id: player1,
                  speler2_id: player2
                },
                {
                  speler1_id: player2,
                  speler2_id: player1
                }
              ],
              uitgestelde_datum: { not: null }
            }
          }) : null;
          
          if (postponedGame) {
            console.log(`Found postponed game ${postponedGame.game_id} with uitgestelde_datum: ${postponedGame.uitgestelde_datum}`);
            
            // Check if the game now has a real result (not "..." or "not_played")
            const hasRealResult = result && result !== "..." && result !== "not_played" && result !== "0-0";
            
            console.log(`Checking if game has real result: result="${result}", hasRealResult=${hasRealResult}, winnaarId=${winnaarId}`);
            
            if (hasRealResult) {
              console.log(`✅ Game now has result ${result}, removing uitgestelde_datum and syncing to makeup round`);
              // Game now has a result, remove the postponement and sync to makeup round
              await prisma.game.update({
                where: { game_id: existingGame.game_id },
                data: {
                  winnaar_id: winnaarId,
                  result: result,
                  uitgestelde_datum: null, // Remove postponement since game is now played
                  board_position: existingGame.board_position, // Preserve board position
                }
              });
              
              // Sync the result to the makeup round
              await this.syncPostponedGameToMakeupRound(existingGame.game_id, result, winnaarId);
            } else {
              console.log(`Game still has no result, preserving uitgestelde_datum`);
              // Game still has no result, preserve the postponement
              await prisma.game.update({
                where: { game_id: existingGame.game_id },
                data: {
                  winnaar_id: winnaarId,
                  result: result,
                  uitgestelde_datum: postponedGame.uitgestelde_datum, // Preserve the postponement date
                  board_position: existingGame.board_position, // Preserve board position
                }
              });
            }
          } else {
            // No postponed game found, update normally
            await prisma.game.update({
              where: { game_id: existingGame.game_id },
              data: {
                winnaar_id: winnaarId,
                result: result,
                board_position: existingGame.board_position, // Preserve board position
              }
            });
          }
        } else {
          // Fallback: update normally if round not found
          await prisma.game.update({
            where: { game_id: existingGame.game_id },
            data: {
              winnaar_id: winnaarId,
              result: result,
              board_position: existingGame.board_position, // Preserve board position
            }
          });
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
          board_position: gamesInRound.size + 1, // Track the board position
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
              board_position: 999, // High number for absent players to put them at the end
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

  /**
   * Sync a postponed game result to its corresponding makeup round
   */
  private async syncPostponedGameToMakeupRound(originalGameId: number, result: string, winnaarId: number | null): Promise<void> {
    try {
      // Get the original game details
      const originalGame = await prisma.game.findUnique({
        where: { game_id: originalGameId },
        include: {
          round: {
            select: { tournament_id: true }
          }
        }
      });

      if (!originalGame || !originalGame.round) {
        console.log(`Original game ${originalGameId} not found or has no round`);
        return;
      }

      // Find ALL makeup rounds for this tournament
      const makeupRounds = await prisma.round.findMany({
        where: {
          tournament_id: originalGame.round.tournament_id,
          type: 'MAKEUP'
        },
        orderBy: {
          ronde_datum: 'asc'
        }
      });

      if (makeupRounds.length === 0) {
        console.log(`No makeup rounds found for tournament ${originalGame.round.tournament_id}`);
        return;
      }

      console.log(`Found ${makeupRounds.length} makeup round(s) for tournament ${originalGame.round.tournament_id}`);

      // Search for the corresponding game in ALL makeup rounds
      // Need to check both player order combinations since they might be swapped
      let makeupGame = null;
      
      // Only search if both players exist (speler2_id might be null for bye games)
      if (originalGame.speler2_id) {
        for (const makeupRound of makeupRounds) {
          // Try to find the game with either player order
          makeupGame = await prisma.game.findFirst({
            where: {
              round_id: makeupRound.round_id,
              OR: [
                {
                  speler1_id: originalGame.speler1_id,
                  speler2_id: originalGame.speler2_id
                },
                {
                  speler1_id: originalGame.speler2_id,
                  speler2_id: originalGame.speler1_id
                }
              ]
            }
          });

          if (makeupGame) {
            console.log(`Found makeup game ${makeupGame.game_id} in round ${makeupRound.round_id} (${makeupRound.label})`);
            break;
          }
        }
      } else {
        console.log(`Original game ${originalGameId} has no speler2_id (bye game?), skipping makeup sync`);
      }

      if (makeupGame) {
        console.log(`Syncing result ${result} to makeup game ${makeupGame.game_id}`);
        // Update the makeup game with the result
        await prisma.game.update({
          where: { game_id: makeupGame.game_id },
          data: {
            winnaar_id: winnaarId,
            result: result
          }
        });
      } else {
        console.log(`No makeup game found in any makeup round for original game ${originalGameId}`);
      }
    } catch (error) {
      console.error('Error syncing postponed game to makeup round:', error);
    }
  }
}

