'use client'

import React, { useState, useEffect } from 'react'
import { User } from '../../../data/types'
import * as usersApi from '../../api/users'
import PlayerTable from './PlayerTable'

export default function PlayerRanking() {
  const [players, setPlayers] = useState<User[]>([])

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const fetchedPlayers = await usersApi.getAll()
        setPlayers(fetchedPlayers)
      } catch (err) {
        console.error('Error fetching players:', err)
      } 
    }

    fetchPlayers()
  }, [])

  return <PlayerTable players={players} />
}