"use client"

import React from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { save } from '../../../api/index'
import { Round, Game } from '@/data/types'
import useSWRMutation from 'swr/mutation'

interface RoundGamesProps {
  round?: Round
  tournamentId: number
  onUpdateGame: () => void
}

export default function RoundGames({ round, onUpdateGame }: RoundGamesProps) {
  const { toast } = useToast()
  const { trigger: updateGame } = useSWRMutation('spel', save)

  if (!round || round.games.length === 0) {
    return <p>Geen paringen voor deze ronde gevonden.</p>
  }

  const handleResultChange = async (gameId: number, result: string) => {
    try {
      const apiResult = result === "not_played" ? "not_played" : result;
      
      console.log("Payload naar API:", { gameId, result: apiResult });
  
      await updateGame({ id: gameId, result: apiResult });
      onUpdateGame();
      toast({ title: "Success", description: "Resultaat succesvol bijgewerkt." });
    } catch (error) {
      console.error("Fout bij het bijwerken van het resultaat:", error);
      toast({
        title: "Error",
        description: "Kon het resultaat niet bijwerken",
        variant: "destructive",
      });
    }
  };

  return (
    <Table className=''>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40%]">Wit</TableHead>
          <TableHead className="w-[40%]">Zwart</TableHead>
          <TableHead className="w-[20%]">Resultaat</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {round.games.map((game: Game) => (
          <TableRow key={game.game_id}>
            <TableCell>
              <div className="flex">
                <span className="flex-grow">{game.speler1.voornaam} {game.speler1.achternaam}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex">
                <span className="flex-grow">
                  {game.speler2 ? 
                    `${game.speler2.voornaam} ${game.speler2.achternaam}` : 
                    'BYE'}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <Select
                onValueChange={(value) => handleResultChange(game.game_id, value)}
                defaultValue={game.result || "not_played"}
              >
                <SelectTrigger className="w-full" data-cy="score_input">
                  <SelectValue placeholder="Selecteer resultaat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-0">1-0</SelectItem>
                  <SelectItem value="0-1">0-1</SelectItem>
                  <SelectItem value="1/2-1/2">1/2-1/2</SelectItem>
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

