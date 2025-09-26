import { prisma } from '../data';

/**
 * Script to reset ratings back to their original values
 * by subtracting schaakrating_difference from schaakrating_elo
 */
async function resetRatings() {
  try {
    console.log('🔄 Starting rating reset...');
    
    // Get all users with rating differences
    const users = await prisma.user.findMany({
      where: {
        schaakrating_difference: {
          not: null
        }
      },
      select: {
        user_id: true,
        voornaam: true,
        achternaam: true,
        schaakrating_elo: true,
        schaakrating_difference: true
      }
    });

    console.log(`Found ${users.length} users with rating differences`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      if (user.schaakrating_difference === null || user.schaakrating_difference === 0) {
        console.log(`⏭️  Skipping ${user.voornaam} ${user.achternaam} - no rating difference`);
        skippedCount++;
        continue;
      }

      const originalRating = user.schaakrating_elo - user.schaakrating_difference;
      
      console.log(`♟️  Resetting ${user.voornaam} ${user.achternaam}: ${user.schaakrating_elo} -> ${originalRating} (difference: ${user.schaakrating_difference})`);

      await prisma.user.update({
        where: { user_id: user.user_id },
        data: {
          schaakrating_elo: originalRating,
          schaakrating_difference: 0 // Reset difference to 0
        }
      });

      updatedCount++;
    }

    console.log(`✅ Rating reset completed!`);
    console.log(`📊 Summary:`);
    console.log(`   - Users updated: ${updatedCount}`);
    console.log(`   - Users skipped: ${skippedCount}`);
    console.log(`   - Total processed: ${users.length}`);

  } catch (error) {
    console.error('❌ Error resetting ratings:', error);
    throw error;
  }
}

// Run the script if called directly
if (require.main === module) {
  resetRatings()
    .then(() => {
      console.log('🎉 Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

export default resetRatings;
