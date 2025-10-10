import { prisma } from '../service/data';

/**
 * Script to manually sync results from regular rounds to makeup rounds
 * for postponed games
 */

async function syncMakeupResults(tournamentId: number) {
  console.log(`\n🔄 Starting sync for tournament ${tournamentId}...\n`);

  try {
    // 1. Get all rounds for this tournament
    const rounds = await prisma.round.findMany({
      where: { tournament_id: tournamentId },
      include: {
        games: {
          include: {
            speler1: true,
            speler2: true,
            winnaar: true
          }
        }
      },
      orderBy: { ronde_nummer: 'asc' }
    });

    const regularRounds = rounds.filter(r => r.type === 'REGULAR');
    const makeupRounds = rounds.filter(r => r.type === 'MAKEUP');

    console.log(`📊 Found ${regularRounds.length} regular rounds and ${makeupRounds.length} makeup rounds`);
    console.log(`\n📋 Regular rounds: ${regularRounds.map(r => `R${r.ronde_nummer} (ID: ${r.round_id})`).join(', ')}`);
    console.log(`📋 Makeup rounds: ${makeupRounds.map(r => `${r.label} (ID: ${r.round_id})`).join(', ')}\n`);

    if (makeupRounds.length === 0) {
      console.log('❌ No makeup rounds found');
      return;
    }

    let syncedCount = 0;
    let notFoundCount = 0;

    // 2. For each regular round, find games with results
    for (const regularRound of regularRounds) {
      console.log(`\n🔍 Checking regular round ${regularRound.ronde_nummer}...`);
      
      for (const game of regularRound.games) {
        // Skip games without real results
        if (!game.result || 
            game.result === '...' || 
            game.result === 'not_played' || 
            game.result === '0-0' || 
            game.result === 'uitgesteld') {
          continue;
        }

        // Skip bye games (no speler2)
        if (!game.speler2_id) {
          continue;
        }

        const player1Name = `${game.speler1.voornaam} ${game.speler1.achternaam}`;
        const player2Name = game.speler2 ? `${game.speler2.voornaam} ${game.speler2.achternaam}` : 'BYE';

        console.log(`  📌 Game ${game.game_id}: ${player1Name} vs ${player2Name} = ${game.result}`);

        // 3. Search for this game in ALL makeup rounds (check both player orders)
        let found = false;
        for (const makeupRound of makeupRounds) {
          const makeupGame = await prisma.game.findFirst({
            where: {
              round_id: makeupRound.round_id,
              OR: [
                {
                  speler1_id: game.speler1_id,
                  speler2_id: game.speler2_id
                },
                {
                  speler1_id: game.speler2_id,
                  speler2_id: game.speler1_id
                }
              ]
            }
          });

          if (makeupGame) {
            found = true;
            console.log(`     ✅ Found in ${makeupRound.label} (game ${makeupGame.game_id})`);
            
            // Check if update is needed
            if (makeupGame.result !== game.result || makeupGame.winnaar_id !== game.winnaar_id) {
              console.log(`     🔄 Updating: "${makeupGame.result}" → "${game.result}"`);
              
              await prisma.game.update({
                where: { game_id: makeupGame.game_id },
                data: {
                  result: game.result,
                  winnaar_id: game.winnaar_id
                }
              });
              
              syncedCount++;
              console.log(`     ✅ Synced!`);
            } else {
              console.log(`     ℹ️  Already up to date`);
            }
            break;
          }
        }

        if (!found) {
          console.log(`     ⚠️  Not found in any makeup round (not postponed?)`);
          notFoundCount++;
        }
      }
    }

    console.log(`\n✅ Sync complete!`);
    console.log(`   📊 Synced: ${syncedCount} games`);
    console.log(`   ℹ️  Not found: ${notFoundCount} games (probably not postponed)\n`);

  } catch (error) {
    console.error('❌ Error syncing makeup results:', error);
    throw error;
  }
}

// Run the script
const tournamentId = process.argv[2] ? parseInt(process.argv[2]) : 74;

console.log(`\n🎯 Syncing makeup results for tournament ID: ${tournamentId}\n`);

syncMakeupResults(tournamentId)
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });

