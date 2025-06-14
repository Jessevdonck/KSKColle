'use client'
import React, { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import useSWRMutation from 'swr/mutation'
import { save } from '../../../api/index'
import { format } from 'date-fns'
import { Game, MakeupDay } from '@/data/types'

interface Props {
  games: Game[]
  tournamentId: number
  makeupDays: MakeupDay[]
  onUpdateGame(): void
}

export default function RoundGames({ games, makeupDays, onUpdateGame }: Props) {
  const { trigger: saveGame } = useSWRMutation('spel', save)
  const [postponing, setPostponing] = useState<number | null>(null)
  const [selectedMD, setSelectedMD] = useState<number | ''>('')

  const handleResultChange = async (gameId: number, result: string) => {
    await saveGame({ id: gameId, result })
    onUpdateGame()
  }

  const handlePostpone = async () => {
    if (postponing && selectedMD) {
      const md = makeupDays.find(m => m.id === selectedMD)!
      // zet uitgestelde datum in game
      await saveGame({ id: postponing, uitgestelde_datum: md.date })
      setPostponing(null)
      setSelectedMD('')
      onUpdateGame()
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Wit</TableHead>
          <TableHead>Zwart</TableHead>
          <TableHead>Resultaat / Uitstel</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {games.map(game => (
          <TableRow key={game.game_id}>
            <TableCell>{game.speler1.voornaam} {game.speler1.achternaam}</TableCell>
            <TableCell>
              {game.speler2
                ? `${game.speler2.voornaam} ${game.speler2.achternaam}`
                : 'BYE'}
            </TableCell>
            <TableCell className="flex items-center space-x-2">
              {/* resultaat-dropdown */}
              <Select
                onValueChange={val => handleResultChange(game.game_id, val)}
                defaultValue={game.result || 'not_played'}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Selecteer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-0">1-0</SelectItem>
                  <SelectItem value="0-1">0-1</SelectItem>
                  <SelectItem value="1/2-1/2">½-½</SelectItem>
                  <SelectItem value="not_played">Niet gespeeld</SelectItem>
                </SelectContent>
              </Select>

              {/* uitstel-knop (alleen als nog niet uitgesteld) */}
              {!game.uitgestelde_datum && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPostponing(game.game_id)}
                >⏰</Button>
              )}
            </TableCell>
            {/* inline selectie van inhaaldag */}
            {postponing === game.game_id && (
              <div className="mt-2 flex items-center space-x-2">
                <Select
                  onValueChange={val => setSelectedMD(Number(val))}
                  value={selectedMD === '' ? undefined : selectedMD.toString()}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Kies inhaaldag" />
                  </SelectTrigger>
                  <SelectContent>
                    {makeupDays.map(md => (
                      <SelectItem
                        key={md.id}
                        value={md.id.toString()}
                      >
                        {md.label || format(new Date(md.date), 'dd-MM-yyyy')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={handlePostpone}
                  disabled={selectedMD === ''}
                >
                  Bevestig
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPostponing(null)}
                >
                  ✕
                </Button>
              </div>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
