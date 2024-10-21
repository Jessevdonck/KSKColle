'use client'

import { getAll } from '../../api/index'
import PlayerTable from './PlayerTable'
import useSWR from 'swr'
import AsyncData from '../../../components/AsyncData'
import { User } from '@/data/types'

export default function PlayerRanking() {
  const {
    data: users = [],
    isLoading,
    error,
  } = useSWR<User[]>('spelers', getAll)

  return (
    <AsyncData loading={isLoading} error={error}>
      <PlayerTable users={users} />
    </AsyncData>
  )
}