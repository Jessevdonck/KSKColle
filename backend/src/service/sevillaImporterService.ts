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

      // Import players from the latest ranking (they should be the same across all rounds)
      const playerMap = await this.importPlayers(latestRanking.Player, tournament.tournament_id, incremental);

      // Import rounds and games from the History section (which contains all games)
      const historySection = mainGroup.History || [];
      if (historySection.length > 0) {
        // Get all players from the first history entry (they should all have the same games)
        const playersWithGames = historySection[0]?.Player || [];
        console.log(`About to import rounds and games from ${playersWithGames.length} players with games`);
        await this.importRoundsAndGames(playersWithGames, tournament.tournament_id, playerMap, incremental);
      } else {
        console.log('No history section found, skipping games import');
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

    for (const sevillaPlayer of players) {
      // Parse name into first and last name
      const nameParts = sevillaPlayer.Name.split(' ');
      const voornaam = nameParts[0] || 'Unknown';
      const achternaam = nameParts.slice(1).join(' ') || 'Unknown';

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
            { email: sevillaPlayer.PlayerID.includes('@') ? sevillaPlayer.PlayerID : `${sevillaPlayer.PlayerID}@kskcolle.be` },
          ],
        },
      });

      if (!user) {
        // Create new user
        user = await prisma.user.create({
          data: {
            voornaam: voornaam,
            achternaam: achternaam,
            email: sevillaPlayer.PlayerID.includes('@') ? sevillaPlayer.PlayerID : `${sevillaPlayer.PlayerID}@kskcolle.be`,
            tel_nummer: '000000000', // Default phone number
            geboortedatum: new Date('1990-01-01'), // Default birth date
            schaakrating_elo: sevillaPlayer.Rating || 1500,
            lid_sinds: new Date(),
            password_hash: 'imported', // Will need to be changed
            roles: JSON.stringify(['SPELER']),
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

    return playerMap;
  }



  private async importRoundsAndGames(players: SevillaPlayer[], tournamentId: number, playerMap: Map<number, number>, incremental: boolean = false) {
    console.log(`=== importRoundsAndGames called with ${players.length} players (incremental: ${incremental}) ===`);
    
    // Bepaal startdatum voor het toernooi (elke ronde is 1 week later)
    const tournamentStartDate = new Date('2024-09-15'); // Aanpasbare startdatum
    
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
      
      // Bereken de datum voor deze ronde (startdatum + (ronde-1) weken)
      const roundDate = new Date(tournamentStartDate);
      roundDate.setDate(roundDate.getDate() + (roundNumber - 1) * 7);
      
      if (incremental) {
        // Check if round exists
        const existingRound = await prisma.round.findFirst({
          where: { 
            tournament_id: tournamentId,
            ronde_nummer: roundNumber 
          }
        });
        
        if (existingRound) {
          console.log(`Round ${roundNumber} exists, updating games...`);
          round = existingRound;
          
          // Delete existing games for this round to replace them
          await prisma.game.deleteMany({
            where: { round_id: existingRound.round_id }
          });
          console.log(`Deleted existing games for round ${roundNumber}`);
        } else {
          // Create new round - determine the correct round number considering makeup days
          const correctRoundNumber = await this.determineCorrectRoundNumber(tournamentId, roundNumber, existingRounds);
          
          round = await prisma.round.create({
            data: {
              tournament_id: tournamentId,
              ronde_nummer: correctRoundNumber,
              ronde_datum: roundDate, // Use calculated date
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
            type: 'REGULAR', // Sevilla rounds are always regular rounds
            is_sevilla_imported: true, // Mark as Sevilla imported
          },
        });
        console.log(`Created round ${roundNumber} with ID ${round.round_id}`);
      }

      // Import games for this round
      await this.importGamesForRound(players, round.round_id, roundNumber, playerMap);
    }
  }

  /**
   * Bepaal het juiste ronde nummer rekening houdend met inhaaldagen
   */
  private async determineCorrectRoundNumber(tournamentId: number, sevillaRoundNumber: number, existingRounds: any[]): Promise<number> {
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

      // Determine winner and result
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

