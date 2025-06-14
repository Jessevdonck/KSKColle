'use client'
import React from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import useSWRMutation from 'swr/mutation'
import { save } from '../../../api/index'
import { MakeupDay, Round, Game } from '@/data/types'
import { format } from 'date-fns'

interface Props {
  makeup: MakeupDay
  rounds: Round[]
  onUpdate(): void
}

export default function MakeupSection({ makeup, rounds, onUpdate }: Props) {
  const { trigger: saveGame } = useSWRMutation('spel', save)

  // verzamel alle games met exact deze datum
  const games: Game[] = rounds
    .flatMap(r => r.games)
    .filter(g => {
      if (!g.uitgestelde_datum) return false
      return new Date(g.uitgestelde_datum).toDateString()
        === new Date(makeup.date).toDateString()
    })

  const handleResultChange = async (gameId: number, result: string) => {
    // bewaar resultaat, laat uitgestelde datum staan
    await saveGame({ id: gameId, result })
    onUpdate()
  }

  return (
    <div className="p-4 border rounded bg-yellow-50">
      <h3 className="text-lg font-semibold mb-2">
        Inhaaldag {makeup.label ?? format(new Date(makeup.date), 'dd-MM-yyyy')}
      </h3>

      {games.length === 0
        ? <p>Geen uitgestelde partijen voor deze dag.</p>
        : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Wit</TableHead>
                <TableHead>Zwart</TableHead>
                <TableHead>Resultaat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {games.map(game => (
                <TableRow key={game.game_id}>
                  <TableCell>
                    {game.speler1.voornaam} {game.speler1.achternaam}
                  </TableCell>
                  <TableCell>
                    {game.speler2
                      ? `${game.speler2.voornaam} ${game.speler2.achternaam}`
                      : 'BYE'}
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )
      }
    </div>
  )
}
