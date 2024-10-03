'use client'

import React, { useState, useMemo } from 'react'
import { Player, playersData } from '../../../data/mock_data'
import PlayerTable from './PlayerTable'

type SortKey = keyof Player
type SortOrder = 'asc' | 'desc'

export default function Playerlist() {
  const [sortKey, setSortKey] = useState<SortKey>('elio_07_24')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const sortedPlayers = useMemo(() => {
    return [...playersData].sort((a, b) => {
      if (a[sortKey] < b[sortKey]) return sortOrder === 'asc' ? -1 : 1
      if (a[sortKey] > b[sortKey]) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [sortKey, sortOrder])

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortOrder('desc')
    }
  }

  return (
    <PlayerTable
      players={sortedPlayers}
      sortKey={sortKey}
      sortOrder={sortOrder}
      onSort={handleSort}
    />
  )
}