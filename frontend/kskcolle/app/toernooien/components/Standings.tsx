import React from 'react'
import Link from 'next/link'

interface StandingsProps {
  tournament: {
    tournament_id: number
    naam: string
    rondes: number
    participations: Array<{
      user: {
        user_id: number
        voornaam: string
        achternaam: string
      }
    }>
  }
  rounds: Array<{
    round_id: number
    ronde_nummer: number
    games: Array<{
      game_id: number
      speler1: { user_id: number, voornaam: string, achternaam: string }
      speler2: { user_id: number, voornaam: string, achternaam: string } | null
      result: string | null
    }>
  }>
}

interface PlayerScore {
  user_id: number
  voornaam: string
  achternaam: string
  score: number
  gamesPlayed: number
}

const createUrlFriendlyName = (voornaam: string, achternaam: string) => {
  return `${voornaam.toLowerCase()}_${achternaam.toLowerCase()}`.replace(/\s+/g, '_')
}

export default function Standings({ tournament, rounds }: StandingsProps) {
  const playerScores: PlayerScore[] = calculateStandings(tournament, rounds)

  const getPositionStyle = (position: number) => {
    const baseStyle = "inline-flex items-center justify-center w-6 h-6 rounded-full text-white font-bold"
    switch (position) {
      case 1:
        return `${baseStyle} bg-yellow-400`  
      case 2:
        return `${baseStyle} bg-gray-300`    
      case 3:
        return `${baseStyle} bg-yellow-600`  
      default:
        return `inline-flex w-6 h-6 justify-center items-center`  
    }
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="bg-mainAccent text-white">
          <th className="p-2 text-left">Positie</th>
          <th className="p-2 text-left">Speler</th>
          <th className="p-2 text-left">Score</th>
          <th className="p-2 text-left">Gespeeld</th>
        </tr>
      </thead>
      <tbody>
        {playerScores.map((player, index) => (
          <tr key={player.user_id} className={`border-b ${index % 2 === 0 ? 'bg-neutral-50' : 'bg-neutral-100'}`}>
            <td className="p-2">
                <span className={getPositionStyle(index + 1)}>{index + 1}</span>
            </td>
            <td className="p-2">
              <Link href={`/profile/${createUrlFriendlyName(player.voornaam, player.achternaam)}`}>
                {player.voornaam} {player.achternaam}
              </Link>
            </td>
            <td className="p-2">{player.score}</td>
            <td className="p-2">{player.gamesPlayed}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function calculateStandings(tournament: StandingsProps['tournament'], rounds: StandingsProps['rounds']): PlayerScore[] {
  const playerScores: { [key: number]: PlayerScore } = {};

  tournament.participations.forEach(participation => {
    const player = participation.user;
    playerScores[player.user_id] = {
      user_id: player.user_id,
      voornaam: player.voornaam,
      achternaam: player.achternaam,
      score: 0,
      gamesPlayed: 0,
    };
  });

  rounds.forEach(round => {
    round.games.forEach(game => {
      const { speler1, speler2, result } = game;

      if (result) {
        if (playerScores[speler1.user_id]) {
          playerScores[speler1.user_id].gamesPlayed++;
        }

        if (speler2 && playerScores[speler2.user_id]) {
          playerScores[speler2.user_id].gamesPlayed++;
        }

        if (result === '1-0' && playerScores[speler1.user_id]) {
          playerScores[speler1.user_id].score += 1;
        } else if (result === '0-1' && speler2 && playerScores[speler2.user_id]) {
          playerScores[speler2.user_id].score += 1;
        } else if (result === '½-½' || result === '1/2-1/2') {
          if (playerScores[speler1.user_id]) {
            playerScores[speler1.user_id].score += 0.5;
          }
          if (speler2 && playerScores[speler2.user_id]) {
            playerScores[speler2.user_id].score += 0.5;
          }
        }
      }
    });
  });

  return Object.values(playerScores).sort((a, b) => b.score - a.score);
}

