'use client'

import { useEffect, useState } from 'react'
import PlayerHeader from './PlayerHeader'
import PlayerRatings from './PlayerRatings'
import RecentGames from './RecentGames'
import * as usersApi from '../../api/users'
import * as gamesApi from '../../api/games'
import { Player, Game } from '../../../data/types'

export default function PlayerProfile({ name }: { name: string }) {
  const [player, setPlayer] = useState<Player | null>(null)
  const [recentGames, setRecentGames] = useState<Game[]>([])

  useEffect(() => {
    const fetchPlayerData = async () => {
      try {
        const [voornaam, achternaam] = name.split('_').map(part => 
          decodeURIComponent(part.charAt(0).toUpperCase() + part.slice(1))
        )
        const fetchedPlayer = await usersApi.getByName(voornaam, achternaam)
        if (!fetchedPlayer) {
          console.error("Player not found");
          return
        }
        setPlayer(fetchedPlayer)
        
        const games = await gamesApi.getRecentGames(fetchedPlayer.user_id)
        setRecentGames(games)
      } catch (error) {
        console.error('Error fetching player data:', error)
      } 
    }

    fetchPlayerData()
  }, [name])

  if (!player) {
    return null 
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <PlayerHeader player={player} />
        <PlayerRatings player={player} />
        <RecentGames games={recentGames} playerId={player.user_id} />
      </div>
    </div>
  )
}