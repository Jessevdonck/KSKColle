'use client'

import { getAll } from '../../api/index'
import PlayerTable from './PlayerTable'
import useSWR from 'swr';
import AsyncData from '../../../components/AsyncData';

export default function PlayerRanking() {

  const {
    data: users = [],
    isLoading,
    error,
  } = useSWR('spelers', getAll);

  return (
    <AsyncData loading={isLoading} error={error}>
      <PlayerTable players={users} />
    </AsyncData>
    
  )
}