'use client'

import { useEffect, useState } from 'react'
import PlayerHeader from './PlayerHeader'
import PlayerRatings from './PlayerRatings'
import RecentGames from './RecentGames'
import * as usersApi from '../../api/users'
import * as gamesApi from '../../api/games'
import { User, GameWithRoundAndTournament } from '../../../data/types'

export default function PlayerProfile({ name }: { name: string }) {
  const [player, setPlayer] = useState<User | null>(null)
  const [recentGames, setRecentGames] = useState<GameWithRoundAndTournament[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPlayerData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [voornaam, achternaam] = name.split('_').map(part => 
          decodeURIComponent(part.charAt(0).toUpperCase() + part.slice(1))
        )
        console.log('Fetching player:', voornaam, achternaam)
        const fetchedPlayer = await usersApi.getByName(voornaam, achternaam)
        console.log('Fetched player:', fetchedPlayer)
        if (!fetchedPlayer) {
          setError("Player not found")
          return
        }
        setPlayer(fetchedPlayer)
        
        console.log('Fetching recent games for player:', fetchedPlayer.user_id)
        const games = await gamesApi.getRecentGames(fetchedPlayer.user_id)
        console.log('Fetched recent games:', games)
        setRecentGames(games)
      } catch (error) {
        console.error('Error fetching player data:', error)
        setError('An error occurred while fetching player data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlayerData()
  }, [name])

  console.log('Current recentGames state:', recentGames)

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8 min-h-screen">Loading...</div>
  }

  if (error) {
    return <div className="container mx-auto px-4 py-8 min-h-screen">Error: {error}</div>
  }

  if (!player) {
    return <div className="container mx-auto px-4 py-8 min-h-screen">Player not found</div>
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