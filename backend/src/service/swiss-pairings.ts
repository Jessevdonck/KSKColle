import { prisma } from "./data/";
import type { Participation } from "../types/participation";
import type { Speler } from "../types/speler";
import type { Spel } from "../types/spel";

type SwissPlayer = Speler & {
  participation: Participation;
};

type Pairing = {
  speler1_id: number;
  speler2_id: number | null;
  color1: 'W' | 'B';
  color2: 'W' | 'B' | 'N';
};

function determineColor(player1: SwissPlayer, player2: SwissPlayer): ['W' | 'B', 'W' | 'B'] {
  const p1ColorHistory = JSON.parse(player1.participation.color_history ?? '[]') as ('W' | 'B' | 'N')[];
  const p2ColorHistory = JSON.parse(player2.participation.color_history ?? '[]') as ('W' | 'B' | 'N')[];

  const p1ColorDiff = p1ColorHistory.filter(c => c === 'W').length - p1ColorHistory.filter(c => c === 'B').length;
  const p2ColorDiff = p2ColorHistory.filter(c => c === 'W').length - p2ColorHistory.filter(c => c === 'B').length;

  if (p1ColorDiff !== p2ColorDiff) {
    return p1ColorDiff < p2ColorDiff ? ['W', 'B'] : ['B', 'W'];
  }

  const p1LastColor = p1ColorHistory[p1ColorHistory.length - 1];
  const p2LastColor = p2ColorHistory[p2ColorHistory.length - 1];

  if (p1LastColor !== p2LastColor) {
    return p1LastColor === 'B' ? ['W', 'B'] : ['B', 'W'];
  }

  const p1Whites = p1ColorHistory.filter(c => c === 'W').length;
  const p2Whites = p2ColorHistory.filter(c => c === 'W').length;
  
  if (p1Whites !== p2Whites) {
    return p1Whites < p2Whites ? ['W', 'B'] : ['B', 'W'];
  }

  return Math.random() < 0.5 ? ['W', 'B'] : ['B', 'W'];
}

function pairFirstRound(players: SwissPlayer[]): [Pairing[], SwissPlayer | undefined] {
  const sortedPlayers = [...players].sort((a, b) => b.schaakrating_elo - a.schaakrating_elo);
  const pairings: Pairing[] = [];
  let byePlayer: SwissPlayer | undefined;

  if (sortedPlayers.length % 2 !== 0) {
    byePlayer = sortedPlayers.pop();
  }

  const middleIndex = Math.floor(sortedPlayers.length / 2);
  const topHalf = sortedPlayers.slice(0, middleIndex);
  const bottomHalf = sortedPlayers.slice(middleIndex);

  for (let i = 0; i < Math.min(topHalf.length, bottomHalf.length); i++) {
    const player1 = topHalf[i];
    const player2 = bottomHalf[i];
    if (player1 && player2) {
      const [color1, color2] = i % 2 === 0 ? (['W', 'B'] as const) : (['B', 'W'] as const);
      pairings.push({
        speler1_id: color1 === 'W' ? player1.user_id : player2.user_id,
        speler2_id: color1 === 'W' ? player2.user_id : player1.user_id,
        color1,
        color2,
      });
    }
  }

  return [pairings, byePlayer];
}

function pairSubsequentRounds(players: SwissPlayer[]): [Pairing[], SwissPlayer | undefined] {
  const sortedPlayers = players.length > 0 ? [...players].sort((a, b) => {
    if (a.participation.score !== b.participation.score) return (b.participation.score ?? 0) - (a.participation.score ?? 0);
    if ((a.participation.buchholz ?? 0) !== (b.participation.buchholz ?? 0)) return (b.participation.buchholz ?? 0) - (a.participation.buchholz ?? 0);
    if ((a.participation.sonnebornBerger ?? 0) !== (b.participation.sonnebornBerger ?? 0)) return (b.participation.sonnebornBerger ?? 0) - (a.participation.sonnebornBerger ?? 0);
    return b.schaakrating_elo - a.schaakrating_elo;
  }) : [];

  const pairings: Pairing[] = [];
  let byePlayer: SwissPlayer | undefined;

  if (sortedPlayers.length === 0) {
    return [pairings, byePlayer];
  }

  if (sortedPlayers.length % 2 !== 0) {
    byePlayer = sortedPlayers.find(player => player.participation.bye_round === null) || sortedPlayers[sortedPlayers.length - 1];
    if (byePlayer) {
      sortedPlayers.splice(sortedPlayers.indexOf(byePlayer), 1);
    }
  }

  while (sortedPlayers.length > 0) {
    const player1 = sortedPlayers.shift();
    if (!player1) break;

    const opponents = JSON.parse(player1.participation.opponents ?? '[]') as number[];
    let opponentIndex = -1;
    let searchScoreDiff = 0;
    const maxScoreDiff = Math.max(...players.map(p => p.participation.score ?? 0)) - Math.min(...players.map(p => p.participation.score ?? 0));

    while (opponentIndex === -1 && searchScoreDiff <= maxScoreDiff) {
      opponentIndex = sortedPlayers.findIndex(p => 
        !opponents.includes(p.user_id) && 
        Math.abs((p.participation.score ?? 0) - (player1.participation.score ?? 0)) === searchScoreDiff
      );
      
      if (opponentIndex === -1) {
        searchScoreDiff += 0.5;
      }
    }

    if (opponentIndex === -1) {
      const allOtherPlayersPlayed = sortedPlayers.every(p => opponents.includes(p.user_id) || p.user_id === player1.user_id);
      
      if (allOtherPlayersPlayed) {
        opponentIndex = sortedPlayers.findIndex(p => p.user_id !== player1.user_id);
      } else {
        throw new Error(`Kan geen geschikte tegenstander vinden voor speler ${player1.user_id}`);
      }
    }

    if (opponentIndex === -1) {
      throw new Error(`Kan geen tegenstander vinden voor speler ${player1.user_id}`);
    }

    const player2 = sortedPlayers.splice(opponentIndex, 1)[0];

    if (player2) {
      const [color1, color2] = determineColor(player1, player2);
      pairings.push({
        speler1_id: color1 === 'W' ? player1.user_id : player2.user_id,
        speler2_id: color1 === 'W' ? player2.user_id : player1.user_id,
        color1,
        color2,
      });
    }
  }

  return [pairings, byePlayer];
}

export async function createSwissPairings(tournament_id: number, round_number: number): Promise<Spel[]> {
  const participations = await prisma.participation.findMany({
    where: { tournament_id },
    include: { user: true },
  });

  const players: SwissPlayer[] = participations.map((p) => ({
    ...p.user,
    participation: p,
  }));

  let pairings: Pairing[];
  let byePlayer: SwissPlayer | undefined;

  if (round_number === 1) {
    [pairings, byePlayer] = pairFirstRound(players);
  } else {
    [pairings, byePlayer] = pairSubsequentRounds(players);
  }

  const games: Spel[] = pairings.map(pairing => ({
    game_id: 0,
    round_id: 0,
    speler1_id: pairing.speler1_id,
    speler2_id: pairing.speler2_id,
    winnaar_id: null,
    result: null,
    uitgestelde_datum: null,
  }));

  if (byePlayer) {
    games.push({
      game_id: 0,
      round_id: 0,
      speler1_id: byePlayer.user_id,
      speler2_id: null,
      winnaar_id: byePlayer.user_id,
      result: '1-0',
      uitgestelde_datum: null,
    });
  }

  return games;
}

export async function savePairings(tournament_id: number, round_number: number, pairings: Spel[]): Promise<void> {
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

  for (const pairing of pairings) {
    const updatePlayer = async (playerId: number, color: 'W' | 'B' | 'N', opponentId: number | null) => {
      const participation = await prisma.participation.findUnique({
        where: { user_id_tournament_id: { user_id: playerId, tournament_id } },
      });

      if (participation) {
        const opponents = JSON.parse(participation.opponents ?? '[]');
        const colorHistory = JSON.parse(participation.color_history ?? '[]');

        await prisma.participation.update({
          where: { user_id_tournament_id: { user_id: playerId, tournament_id } },
          data: {
            opponents: JSON.stringify([...opponents, opponentId]),
            color_history: JSON.stringify([...colorHistory, color]),
            bye_round: color === 'N' ? round_number : participation.bye_round,
          },
        });
      }
    };

    await updatePlayer(pairing.speler1_id, pairing.speler2_id != null ? 'W' : 'N', pairing.speler2_id ?? null);
    if (pairing.speler2_id != null) {
      await updatePlayer(pairing.speler2_id, 'B', pairing.speler1_id);
    }
  }
}

export async function updateTournamentScores(tournament_id: number): Promise<void> {
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
  });

  for (const participation of participations) {
    let score = 0;
    let buchholz = 0;
    let sonnebornBerger = 0;

    for (const game of games) {
      if (game.speler1_id === participation.user_id || game.speler2_id === participation.user_id) {
        if (game.winnaar_id === participation.user_id) {
          score += 1;
          sonnebornBerger += (game.speler1_id === participation.user_id ? game.speler2_id : game.speler1_id) || 0;
        } else if (game.result === '1/2-1/2') {
          score += 0.5;
          sonnebornBerger += ((game.speler1_id === participation.user_id ? game.speler2_id : game.speler1_id) || 0) / 2;
        }
      }
    }

    const opponents = JSON.parse(participation.opponents ?? '[]') as number[];
    for (const opponentId of opponents) {
      const opponentParticipation = participations.find(p => p.user_id === opponentId);
      if (opponentParticipation) {
        buchholz += opponentParticipation.score ?? 0;
      }
    }

    await prisma.participation.update({
      where: { user_id_tournament_id: { user_id: participation.user_id, tournament_id } },
      data: {
        score,
        buchholz,
        sonnebornBerger,
      },
    });
  }
}

export async function createAndSaveSwissPairings(tournament_id: number, round_number: number): Promise<void> {
  await updateTournamentScores(tournament_id);
  const pairings = await createSwissPairings(tournament_id, round_number);
  await savePairings(tournament_id, round_number, pairings);
}