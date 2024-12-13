'use client'

import useSWR from 'swr'
import PlayerHeader from './PlayerHeader'
import PlayerRatings from './PlayerRatings'
import RecentGames from './RecentGames'
import AsyncData from '../../components/AsyncData'
import * as usersApi from '../../api/users'
import * as gamesApi from '../../api/games'
import { User, GameWithRoundAndTournament } from '../../../data/types'

export default function PlayerProfile({ name }: { name: string }) {
  const [voornaam, ...achternaamParts] = name.split('_').map(part => 
    decodeURIComponent(part.charAt(0).toUpperCase() + part.slice(1))
  )
  const achternaam = achternaamParts.join(' ')

  const { data: player, error: playerError } = useSWR<User>(
    ['player', voornaam, achternaam],
    () => usersApi.getByName(voornaam, achternaam)
  )

  const { data: recentGames = [], error: gamesError } = useSWR<GameWithRoundAndTournament[]>(
    player ? ['recentGames', player.user_id] : null,
    () => gamesApi.getRecentGames(player!.user_id)
  )

  const isLoading = !player && !playerError
  const error = playerError || gamesError

  return (
    <AsyncData loading={isLoading} error={error}>
      {player && (
        <div className="container mx-auto px-4 py-8 min-h-screen">
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <PlayerHeader player={player} />
            <PlayerRatings player={player} />
            <RecentGames games={recentGames} playerId={player.user_id} />
          </div>
        </div>
      )}
    </AsyncData>
  )
}