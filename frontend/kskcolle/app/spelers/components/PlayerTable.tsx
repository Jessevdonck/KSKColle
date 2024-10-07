import React from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { Player } from '../../../data/mock_data'

type SortKey = keyof Player
type SortOrder = 'asc' | 'desc'

interface PlayerProps {
  players: Player[]
  sortKey: SortKey
  sortOrder: SortOrder
  onSort: (key: SortKey) => void
}

export default function players({ players, sortKey, sortOrder, onSort }: PlayerProps) {
  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (columnKey !== sortKey) return null
    return sortOrder === 'asc' ? <ChevronUp className="inline w-4 h-4" /> : <ChevronDown className="inline w-4 h-4" />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-[#4A4947] mb-6">Spelers Ranglijst</h2>
      <div className="overflow-x-auto">
        <table className="w-full bg-white shadow-md rounded-lg">
          <thead className="bg-[#B17457] text-white">
            <tr>
              {['Speler', 'ELIO 01/\'24', 'ELIO 07/\'24', '+/-', 'MAX'].map((header, index) => {
                const key = ['name', 'elio_01_24', 'elio_07_24', 'difference', 'max'][index] as SortKey
                return (
                  <th 
                    key={key}
                    className="px-4 py-2 text-left cursor-pointer hover:bg-[#A06346] transition-colors"
                    onClick={() => onSort(key)}
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
            {players.map((player, index) => (
              <tr key={player.name} className={index % 2 === 0 ? 'bg-[#ebe8e0]' : 'bg-[#f3f1ea]'}>
                <td className="px-4 py-2 border-b">{player.name}</td>
                <td className="px-4 py-2 border-b">{player.elio_01_24}</td>
                <td className="px-4 py-2 border-b">{player.elio_07_24}</td>
                <td className="px-4 py-2 border-b">{player.difference}</td>
                <td className="px-4 py-2 border-b">{player.max}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}