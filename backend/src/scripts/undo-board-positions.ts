import { prisma } from '../service/data';

/**
 * Script to restore original board positions for Sevilla-imported rounds
 * This resets board positions to their original import order (by game_id)
 */

async function undoBoardPositions(tournamentId: number) {
  console.log(`\n↩️  Undoing board position changes for tournament ${tournamentId}...\n`);

  try {
    // Get tournament info
    const tournament = await prisma.tournament.findUnique({
      where: { tournament_id: tournamentId },
      select: { naam: true, type: true }
    });

    if (!tournament) {
      console.log('❌ Tournament not found');
      return;
    }

    console.log(`📊 Tournament: ${tournament.naam} (${tournament.type})`);

    // Get all regular rounds with games
    const rounds = await prisma.round.findMany({
      where: { 
        tournament_id: tournamentId,
        type: 'REGULAR',
        is_sevilla_imported: true
      },
      include: {
        games: true
      },
      orderBy: { ronde_nummer: 'asc' }
    });

    console.log(`\n📋 Found ${rounds.length} Sevilla-imported rounds\n`);

    let totalRestored = 0;

    // Process each round
    for (const round of rounds) {
      console.log(`\n🔄 Round ${round.ronde_nummer} (${round.ronde_datum.toISOString().split('T')[0]})`);

      if (round.games.length === 0) {
        console.log('   ⚠️  No games in this round');
        continue;
      }

      // Sort games by game_id (original import order)
      const sortedGames = [...round.games].sort((a, b) => a.game_id - b.game_id);

      // Restore original board positions based on import order
      let restoredInRound = 0;
      for (let i = 0; i < sortedGames.length; i++) {
        const game = sortedGames[i];
        if (!game) continue;
        
        const originalPosition = i + 1;

        // Update to original position
        if (game.board_position !== originalPosition) {
          await prisma.game.update({
            where: { game_id: game.game_id },
            data: { board_position: originalPosition }
          });

          console.log(`   ✅ Game ${game.game_id}: ${game.board_position} → ${originalPosition}`);
          
          restoredInRound++;
          totalRestored++;
        }
      }

      if (restoredInRound === 0) {
        console.log('   ℹ️  Board positions already in original order');
      } else {
        console.log(`   📊 Restored ${restoredInRound} board positions`);
      }
    }

    console.log(`\n✅ Complete! Restored ${totalRestored} board positions to original order\n`);

  } catch (error) {
    console.error('❌ Error restoring board positions:', error);
    throw error;
  }
}

// Run the script
const tournamentId = process.argv[2] ? parseInt(process.argv[2]) : 74;

console.log(`\n🎯 Restoring original board positions for tournament ID: ${tournamentId}\n`);

undoBoardPositions(tournamentId)
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });

