import React from 'react'
import { Tournament, Player } from '../../../data/mock_data'
import Link from 'next/link'

interface StandingsProps {
  tournament: Tournament
}

interface PlayerScore extends Player {
  score: number
  gamesPlayed: number
}

export default function Standings({ tournament }: StandingsProps) {
  const playerScores: PlayerScore[] = calculateStandings(tournament)

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
          <tr key={player.id} className={`border-b ${index % 2 === 0 ? 'bg-neutral-50' : 'bg-neutral-100'}`}>
            <td className="p-2">
                <span className={getPositionStyle(index + 1)}>{index + 1}</span>
            </td>
            <td className="p-2"><Link href={`/profile/${player.id}`}>{player.name}</Link></td>
            <td className="p-2">{player.score}</td>
            <td className="p-2">{player.gamesPlayed}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function calculateStandings(tournament: Tournament): PlayerScore[] {
  const playerScores: { [key: string]: PlayerScore } = {}

  tournament.rounds.forEach(round => {
    round.games.forEach(game => {
      const { whitePlayer, blackPlayer, result } = game

      if (!playerScores[whitePlayer.id]) {
        playerScores[whitePlayer.id] = { ...whitePlayer, score: 0, gamesPlayed: 0 }
      }
      if (!playerScores[blackPlayer.id]) {
        playerScores[blackPlayer.id] = { ...blackPlayer, score: 0, gamesPlayed: 0 }
      }

      if (result) {
        playerScores[whitePlayer.id].gamesPlayed++
        playerScores[blackPlayer.id].gamesPlayed++

        if (result === '1-0') {
          playerScores[whitePlayer.id].score += 1
        } else if (result === '0-1') {
          playerScores[blackPlayer.id].score += 1
        } else if (result === '½-½') {
          playerScores[whitePlayer.id].score += 0.5
          playerScores[blackPlayer.id].score += 0.5
        }
      }
    })
  })

  return Object.values(playerScores).sort((a, b) => b.score - a.score)
}