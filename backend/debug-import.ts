import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugImport() {
  console.log('🔍 Debugging import data...');
  
  // Check all participations
  const participations = await prisma.participation.findMany({
    where: {
      tournament: {
        naam: {
          contains: 'Herfstcompetitie'
        }
      }
    },
    include: {
      user: true,
      tournament: true
    },
    take: 5
  });

  console.log(`Found ${participations.length} participations:`);
  
  participations.forEach(p => {
    console.log(`\n- ${p.user.voornaam} ${p.user.achternaam} (${p.tournament.naam}):`);
    console.log(`  sevilla_rating_change: ${p.sevilla_rating_change}`);
    console.log(`  sevilla_initial_rating: ${p.sevilla_initial_rating}`);
    console.log(`  sevilla_final_rating: ${p.sevilla_final_rating}`);
    console.log(`  tie_break: ${p.tie_break}`);
    console.log(`  score: ${p.score}`);
  });

  await prisma.$disconnect();
}

debugImport().catch(console.error);
