'use client'

import { getAll } from '../../api/index'
import PlayerTable from './PlayerTable'
import useSWR from 'swr'
import AsyncData from '../../components/AsyncData'
import { User } from '@/data/types'

export default function PlayerRanking() {
  const {
    data: users = [],
    isLoading,
    error,
  } = useSWR<User[]>('users/publicUsers', getAll)

  const noPlayersError = users.length === 0 && !isLoading && !error;

  return (
    <AsyncData loading={isLoading} error={error}>
      {noPlayersError && (
        <div className="flex items-center justify-center" data-cy="no_users_message">
          <div className="text-center text-red-500 bg-red-100 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-2">Geen spelers gevonden</h2>
            <p>Er zijn momenteel geen spelers in de database.</p>
          </div>
        </div>
      )}
      <PlayerTable users={users} />
    </AsyncData>
  )
}