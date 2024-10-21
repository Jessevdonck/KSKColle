import React, { useState, useCallback } from 'react'
import Link from 'next/link'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { User } from '@/data/types'

type SortKey = keyof User
type SortOrder = 'asc' | 'desc'

const createUrlFriendlyName = (voornaam: string, achternaam: string) => {
  return `${voornaam.toLowerCase()}_${achternaam.toLowerCase()}`.replace(/\s+/g, '_')
}

interface PlayerTableProps {
  users: User[]
}

export default function PlayerTable({ users }: PlayerTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('schaakrating_elo')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const sortPlayers = useCallback((a: User, b: User) => {
    if (a[sortKey] == null || b[sortKey] == null) {
      return 0
    }
    if (a[sortKey] < b[sortKey]) return sortOrder === 'asc' ? -1 : 1
    if (a[sortKey] > b[sortKey]) return sortOrder === 'asc' ? 1 : -1
    return 0
  }, [sortKey, sortOrder])

  const handleSort = (key: SortKey) => {
    setSortOrder(currentOrder => 
      key === sortKey && currentOrder === 'asc' ? 'desc' : 'asc'
    )
    setSortKey(key)
  }

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (columnKey !== sortKey) return null
    return sortOrder === 'asc' ? <ChevronUp className="inline w-4 h-4" /> : <ChevronDown className="inline w-4 h-4" />
  }

  const sortedPlayers = [...users].sort(sortPlayers)

  return (
    <div className="container mx-auto px-4 py-8 w-3/4 min-h-screen">
      <h2 className="text-3xl font-bold text-[#4A4947] mb-6">Spelers Ranglijst</h2>
      <div className="overflow-x-auto rounded-sm shadow-lg shadow-emerald-950/10">
        <table className="w-full bg-white shadow-md rounded-lg">
          <thead className="bg-mainAccent text-white">
            <tr>
              {['Speler', 'ELO', '+/-', 'MAX'].map((header, index) => {
                const key = ['achternaam', 'schaakrating_elo', 'schaakrating_difference', 'schaakrating_max'][index] as SortKey
                return (
                  <th 
                    key={key}
                    className="px-4 py-2 text-left cursor-pointer hover:bg-mainAccentDark transition-colors"
                    onClick={() => handleSort(key)}
                  >
                    <span className="flex items-center">
                      {header}
                      <SortIcon columnKey={key} />
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((player) => (
              <tr key={player.user_id} className={sortedPlayers.indexOf(player) % 2 === 0 ? 'bg-neutral-50' : 'bg-neutral-100'}>
                <td className="px-4 py-2 border-b">
                  <Link href={`/profile/${createUrlFriendlyName(player.voornaam, player.achternaam)}`} className="text-textColor hover:text-mainAccent">
                    {`${player.achternaam}, ${player.voornaam}`}
                  </Link>
                </td>
                <td className="px-4 py-2 border-b">{player.schaakrating_elo}</td>
                <td className="px-4 py-2 border-b">{player.schaakrating_difference || '-'}</td>
                <td className="px-4 py-2 border-b">{player.schaakrating_max || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}