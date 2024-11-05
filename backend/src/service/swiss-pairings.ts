import type { Speler } from "../types/speler";
import type { Spel } from "../types/spel";
import { prisma } from "./data/";

type SwissPlayer = Speler & {
  score: number;
  opponents: number[];
  color_history: ('W' | 'B' | 'N')[];
  float_history: ('up' | 'down' | 'none')[];
};

function calculateBuchholz(player: SwissPlayer, allPlayers: SwissPlayer[]): number {
  return player.opponents.reduce((sum, opponentId) => {
    const opponent = allPlayers.find((p) => p.user_id === opponentId);
    return sum + (opponent ? opponent.score : 0);
  }, 0);
}

function calculateSonnebornBerger(player: SwissPlayer, games: Spel[], allPlayers: SwissPlayer[]): number {
  return games
    .filter((game) => game.speler1_id === player.user_id || game.speler2_id === player.user_id)
    .reduce((sum, game) => {
      const isPlayer1 = game.speler1_id === player.user_id;
      const opponentScore = allPlayers.find((p) => p.user_id === (isPlayer1 ? game.speler2_id : game.speler1_id))?.score || 0;
      if (game.winnaar_id === player.user_id) {
        return sum + opponentScore;
      } else if (game.result === '1/2-1/2') {
        return sum + opponentScore / 2;
      }
      return sum;
    }, 0);
}

function determineColor(player1: SwissPlayer, player2: SwissPlayer): ['W' | 'B', 'W' | 'B'] {
  const p1LastColor = player1.color_history[player1.color_history.length - 1];
  const p2LastColor = player2.color_history[player2.color_history.length - 1];

  if (p1LastColor === p2LastColor) {
    return player1.color_history.filter((c) => c === 'W').length < player2.color_history.filter((c) => c === 'W').length
      ? ['W', 'B']
      : ['B', 'W'];
  }

  return p1LastColor === 'B' ? ['W', 'B'] : ['B', 'W'];
}

export async function createSwissPairings(tournament_id: number): Promise<Spel[]> {
  const participations = await prisma.participation.findMany({
    where: { tournament_id },
    include: { user: true },
  });

  const games = await prisma.game.findMany({
    where: {
      round: {
        tournament_id,
      },
    },
    include: {
      round: true,
    },
  });

  const players: SwissPlayer[] = participations.map((p) => ({
    ...p.user,
    score: 0,
    opponents: [],
    color_history: [],
    float_history: [],
  }));

  games.forEach((game) => {
    const player1 = players.find((p) => p.user_id === game.speler1_id);
    const player2 = players.find((p) => p.user_id === game.speler2_id);

    if (player1 && player2) {
      player1.opponents.push(player2.user_id);
      player2.opponents.push(player1.user_id);

      if (game.winnaar_id === player1.user_id) {
        player1.score += 1;
      } else if (game.winnaar_id === player2.user_id) {
        player2.score += 1;
      } else if (game.result === '1/2-1/2') {
        player1.score += 0.5;
        player2.score += 0.5;
      }

      const [color1, color2] = determineColor(player1, player2);
      player1.color_history.push(color1);
      player2.color_history.push(color2);
    }
  });

  players.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const buchholzDiff = calculateBuchholz(b, players) - calculateBuchholz(a, players);
    if (buchholzDiff !== 0) return buchholzDiff;
    return calculateSonnebornBerger(b, games, players) - calculateSonnebornBerger(a, games, players);
  });

  const pairings: Spel[] = [];
  const unpairedPlayers = [...players];

  while (unpairedPlayers.length > 1) {
    const player1 = unpairedPlayers.shift();
    if (!player1) break; 
    let opponent;

    for (let i = 0; i < unpairedPlayers.length; i++) {
      if (!player1.opponents.includes(unpairedPlayers[i].user_id)) {
        opponent = unpairedPlayers.splice(i, 1)[0];
        break;
      }
    }

    if (!opponent) {
      opponent = unpairedPlayers.shift()!;
    }

    const [color1, color2] = determineColor(player1, opponent);

    pairings.push({
      game_id: 0, 
      round_id: 0, 
      speler1_id: color1 === 'W' ? player1.user_id : opponent.user_id,
      speler2_id: color1 === 'W' ? opponent.user_id : player1.user_id,
      winnaar_id: null,
      result: null,
      uitgestelde_datum: null,
    });

    player1.color_history.push(color1);
    opponent.color_history.push(color2);
  }

  if (unpairedPlayers.length === 1) {
    const byePlayer = unpairedPlayers[0];
    if (byePlayer) {
      byePlayer.score += 1; 
      byePlayer.color_history.push('N' as 'W' | 'B' | 'N'); 
      byePlayer.float_history.push('down');

      pairings.push({
        game_id: 0, 
        round_id: 0, 
        speler1_id: byePlayer.user_id,
        speler2_id: null, 
        winnaar_id: byePlayer.user_id, 
        result: '1-0', 
        uitgestelde_datum: null,
      });
    }
  }

  return pairings;
}

export async function savePairings(tournament_id: number, round_number: number, pairings: Spel[]) {
  const round = await prisma.round.create({
    data: {
      tournament_id,
      ronde_nummer: round_number,
      ronde_datum: new Date(),
    },
  });

  await prisma.game.createMany({
    data: pairings.map((pairing) => ({
      ...pairing,
      round_id: round.round_id,
    })),
  });
}

export async function createAndSaveSwissPairings(tournament_id: number, round_number: number): Promise<void> {
  const pairings = await createSwissPairings(tournament_id, round_number);
  await savePairings(tournament_id, round_number, pairings);
}