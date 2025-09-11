import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugGames() {
  console.log('=== DEBUGGING GAMES ===');
  
  // Find Sarah Buys-Devillé
  const sarah = await prisma.user.findFirst({
    where: {
      OR: [
        { voornaam: 'Sarah', achternaam: 'Buys-Devillé' },
        { voornaam: 'Sarah', achternaam: 'Buys-Deville' }
      ]
    }
  });

  if (!sarah) {
    console.log('Sarah not found');
    await prisma.$disconnect();
    return;
  }

  console.log(`Found Sarah: ${sarah.voornaam} ${sarah.achternaam} (ID: ${sarah.user_id})`);

  // Get tournament 1 (Herfstcompetitie 2024)
  const tournament = await prisma.tournament.findFirst({
    where: { tournament_id: 1 }
  });

  if (!tournament) {
    console.log('Tournament not found');
    await prisma.$disconnect();
    return;
  }

  console.log(`Tournament: ${tournament.naam} (ID: ${tournament.tournament_id})`);

  // Get all games for Sarah in this tournament
  const games = await prisma.game.findMany({
    where: {
      OR: [
        { speler1_id: sarah.user_id },
        { speler2_id: sarah.user_id }
      ],
      round: {
        tournament_id: tournament.tournament_id
      }
    },
    include: {
      round: true,
      speler1: { select: { voornaam: true, achternaam: true } },
      speler2: { select: { voornaam: true, achternaam: true } }
    },
    orderBy: {
      round: { ronde_nummer: 'asc' }
    }
  });

  console.log(`\n=== SARAH'S GAMES (${games.length} games) ===`);
  if (games.length === 0) {
    console.log('No games found for Sarah');
  } else {
    games.forEach(game => {
      const isPlayer1 = game.speler1_id === sarah.user_id;
      const opponent = isPlayer1 ? game.speler2 : game.speler1;
      const opponentName = opponent ? `${opponent.voornaam} ${opponent.achternaam}` : 'NULL';
      
      console.log(`R${game.round.ronde_nummer}: vs ${opponentName} - Result: "${game.result}" - Winner: ${game.winnaar_id || 'NULL'}`);
    });
  }

  // Check for rounds where Sarah has no game (true BYE)
  const rounds = await prisma.round.findMany({
    where: { tournament_id: tournament.tournament_id },
    orderBy: { ronde_nummer: 'asc' }
  });

  console.log(`\n=== ALL ROUNDS ANALYSIS ===`);
  for (const round of rounds) {
    const hasGame = games.some(game => game.round_id === round.round_id);
    if (hasGame) {
      const game = games.find(game => game.round_id === round.round_id);
      console.log(`R${round.ronde_nummer}: HAS GAME - Result: "${game?.result}"`);
    } else {
      console.log(`R${round.ronde_nummer}: NO GAME - TRUE BYE`);
    }
  }

  // Check if there are any games with Sarah as speler1 and null speler2
  const singlePlayerGames = await prisma.game.findMany({
    where: {
      speler1_id: sarah.user_id,
      speler2_id: null
    },
    include: {
      round: true
    }
  });

  console.log(`\n=== SINGLE PLAYER GAMES (speler2 = null) ===`);
  singlePlayerGames.forEach(game => {
    console.log(`R${game.round.ronde_nummer}: Result: "${game.result}" - Winner: ${game.winnaar_id || 'NULL'}`);
  });

  await prisma.$disconnect();
}

debugGames().catch(console.error);
