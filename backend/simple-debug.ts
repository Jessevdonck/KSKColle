import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find Sarah
  const sarah = await prisma.user.findFirst({
    where: { voornaam: 'Sarah' }
  });
  
  if (!sarah) {
    console.log('Sarah not found');
    return;
  }
  
  console.log(`Sarah ID: ${sarah.user_id}`);
  
  // Check all games with Sarah
  const games = await prisma.game.findMany({
    where: {
      OR: [
        { speler1_id: sarah.user_id },
        { speler2_id: sarah.user_id }
      ]
    },
    include: {
      round: { select: { ronde_nummer: true } }
    }
  });
  
  console.log(`Sarah has ${games.length} games:`);
  games.forEach(game => {
    console.log(`R${game.round.ronde_nummer}: speler1=${game.speler1_id}, speler2=${game.speler2_id}, result="${game.result}"`);
  });
  
  await prisma.$disconnect();
}

main().catch(console.error);
