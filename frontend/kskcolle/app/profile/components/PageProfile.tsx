'use client'

import useSWR from 'swr'
import PlayerHeader from './PlayerHeader'
import RecentGames from './RecentGames'
import AsyncData from '../../components/AsyncData'
import { getById } from '../../api/index'
import { User, GameWithRoundAndTournament } from '../../../data/types'

export default function PlayerProfile({ name }: { name: string }) {
  const [voornaam, ...achternaamParts] = name.split('_').map(part => 
    decodeURIComponent(part.charAt(0).toUpperCase() + part.slice(1))
  )
  const achternaam = achternaamParts.join(' ')

  const { data: player, error: playerError } = useSWR<User>(
    ['player', voornaam, achternaam],
    () => getById(`users/by-name?voornaam=${encodeURIComponent(voornaam)}&achternaam=${encodeURIComponent(achternaam)}`)
  )

  const { data: recentGames = [], } = useSWR<GameWithRoundAndTournament[]>(
    player ? ['recentGames', player.user_id] : null,
    () => getById(`spel/speler/${player!.user_id}`)
  )

  const isLoading = !player && !playerError
  const error = playerError 

  return (
    <AsyncData loading={isLoading} error={error}>
      {player && (
        <div className="container mx-auto px-4 py-8 min-h-screen">
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <PlayerHeader player={player} />
            <RecentGames games={recentGames} playerId={player.user_id} />
          </div>
        </div>
      )}
    </AsyncData>
  )
}

