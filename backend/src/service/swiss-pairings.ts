import type { Speler } from "../types/speler";
import type { Spel } from "../types/spel";
import { prisma } from "./data/";

type SwissPlayer = Speler & {
  score: number;
  opponents: number[];
  color_history: ('W' | 'B' | 'N')[];
  float_history: ('up' | 'down' | 'none')[];
  bye_round: number | null;
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
  const p1ColorDiff = player1.color_history.filter(c => c === 'W').length - player1.color_history.filter(c => c === 'B').length;
  const p2ColorDiff = player2.color_history.filter(c => c === 'W').length - player2.color_history.filter(c => c === 'B').length;

  if (p1ColorDiff !== p2ColorDiff) {
    return p1ColorDiff < p2ColorDiff ? ['W', 'B'] : ['B', 'W'];
  }

  const p1LastColor = player1.color_history[player1.color_history.length - 1];
  const p2LastColor = player2.color_history[player2.color_history.length - 1];

  if (p1LastColor !== p2LastColor) {
    return p1LastColor === 'B' ? ['W', 'B'] : ['B', 'W'];
  }

  const p1Whites = player1.color_history.filter(c => c === 'W').length;
  const p2Whites = player2.color_history.filter(c => c === 'W').length;
  
  if (p1Whites !== p2Whites) {
    return p1Whites < p2Whites ? ['W', 'B'] : ['B', 'W'];
  }

  return Math.random() < 0.5 ? ['W', 'B'] : ['B', 'W'];
}

function pairFirstRound(players: SwissPlayer[]): [Spel[], SwissPlayer | undefined] {
  const sortedPlayers = [...players].sort((a, b) => b.schaakrating_elo - a.schaakrating_elo);
  const pairings: Spel[] = [];
  let byePlayer: SwissPlayer | undefined;

  if (sortedPlayers.length % 2 !== 0) {
    byePlayer = sortedPlayers.pop();
    if (byePlayer) {
      byePlayer.score += 1;
      byePlayer.color_history.push('N');
      byePlayer.float_history.push('down');
      byePlayer.bye_round = 1;
    }
  }

  const middleIndex = Math.floor(sortedPlayers.length / 2);
  const topHalf = sortedPlayers.slice(0, middleIndex);
  const bottomHalf = sortedPlayers.slice(middleIndex);

  for (let i = 0; i < Math.min(topHalf.length, bottomHalf.length); i++) {
    const player1 = topHalf[i];
    const player2 = bottomHalf[i];
    if (player1 && player2) {
      const [color1, color2] = i % 2 === 0 ? ['W', 'B'] : ['B', 'W'];
      pairings.push({
        game_id: 0,
        round_id: 0,
        speler1_id: color1 === 'W' ? player1.user_id : player2.user_id,
        speler2_id: color1 === 'W' ? player2.user_id : player1.user_id,
        winnaar_id: null,
        result: null,
        uitgestelde_datum: null,
      });
      player1.color_history.push(color1 as 'W' | 'B' | 'N');
      player2.color_history.push(color2 as 'W' | 'B' | 'N');
      player1.opponents.push(player2.user_id);
      player2.opponents.push(player1.user_id);
    }
  }

  return [pairings, byePlayer];
}

function pairSubsequentRounds(players: SwissPlayer[], round_number: number): [Spel[], SwissPlayer | undefined] {
  const sortedPlayers = [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.schaakrating_elo - a.schaakrating_elo;
  });

  const pairings: Spel[] = [];
  let byePlayer: SwissPlayer | undefined;

  if (sortedPlayers.length % 2 !== 0) {
    const byeCandidates = [...sortedPlayers].sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return b.schaakrating_elo - a.schaakrating_elo;
    });

    for (let i = 0; i < byeCandidates.length; i++) {
      const candidate = byeCandidates[i];
      if (candidate && candidate.bye_round === null) {
        const playerIndex = sortedPlayers.findIndex(p => p.user_id === candidate.user_id);
        if (playerIndex !== -1) {
          byePlayer = sortedPlayers.splice(playerIndex, 1)[0];
          break;
        }
      }
    }

    if (!byePlayer) {
      byePlayer = sortedPlayers.pop();
    }

    if (byePlayer) {
      byePlayer.score += 1;
      byePlayer.color_history.push('N');
      byePlayer.float_history.push('down');
      byePlayer.bye_round = round_number;
    }
  }

  while (sortedPlayers.length > 0) {
    const player1 = sortedPlayers.shift();
    if (!player1) break;

    let opponentIndex = sortedPlayers.findIndex(p => p && !player1.opponents.includes(p.user_id));
    if (opponentIndex === -1) {
      opponentIndex = 0;
    }
    const player2 = sortedPlayers.splice(opponentIndex, 1)[0];

    if (player2) {
      const [color1, color2] = determineColor(player1, player2);
      pairings.push({
        game_id: 0,
        round_id: 0,
        speler1_id: color1 === 'W' ? player1.user_id : player2.user_id,
        speler2_id: color1 === 'W' ? player2.user_id : player1.user_id,
        winnaar_id: null,
        result: null,
        uitgestelde_datum: null,
      });
      player1.color_history.push(color1 as 'W' | 'B' | 'N');
      player2.color_history.push(color2 as 'W' | 'B' | 'N');
      player1.opponents.push(player2.user_id);
      player2.opponents.push(player1.user_id);
    }
  }

  return [pairings, byePlayer];
}

export async function createSwissPairings(tournament_id: number, round_number: number): Promise<Spel[]> {
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
    bye_round: null,
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

      player1.color_history.push(game.speler1_id === player1.user_id ? 'W' : 'B');
      player2.color_history.push(game.speler1_id === player2.user_id ? 'W' : 'B');
    } else if (player1 && !player2) {
      player1.score += 1;
      player1.color_history.push('N');
      player1.bye_round = game.round.ronde_nummer;
    }
  });

  let pairings: Spel[];
  let byePlayer: SwissPlayer | undefined;

  if (round_number === 1) {
    [pairings, byePlayer] = pairFirstRound(players);
  } else {
    [pairings, byePlayer] = pairSubsequentRounds(players, round_number);
  }

  if (byePlayer) {
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