// src/app/admin/Tournaments/rounds/RoundManagement.tsx
'use client'
import React, { useState } from 'react'
import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import { getById, generatePairings, endTournament, postMakeupDay, getAll } from '../../../api/index'
import type { Toernooi, MakeupDay, Round } from '@/data/types'
import RoundSection from './RoundSection'
import MakeupSection from './MakeupSection'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'

interface Props {
  tournament: Toernooi
}

export default function RoundManagement({ tournament }: Props) {
  const { toast } = useToast()

  // 1) Fetch toernooi + rondes
  const { data: T, mutate: refetchT } = useSWR<Toernooi>(
    `tournament/${tournament.tournament_id}`,
    () => getById(`tournament/${tournament.tournament_id}`)
  )

  // 2) Fetch alle inhaaldagen
  const {
  data: makeupDays = [],
  mutate: refetchMD,
  } = useSWR<MakeupDay[]>(
    ['makeupDay', tournament.tournament_id],
    () => getAll(`makeupDay?tournament_id=${tournament.tournament_id}`)
  )

  // 3) Mutations: paringen, einde-toernooi, nieuwe inhaaldag
  const { trigger: genPair } = useSWRMutation(
    'tournament',
    generatePairings
  )
  const { trigger: endT, isMutating: ending } = useSWRMutation(
    'tournament',
    endTournament
  )
  const { trigger: createMakeup, isMutating: creatingMD } = useSWRMutation(
    'makeupDay',
    postMakeupDay
  )

  // Form-state voor “nieuwe inhaaldag”
  const [addingNew, setAddingNew] = useState(false)
  const [newRoundAfter, setNewRoundAfter] = useState(1)
  const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [newLabel, setNewLabel] = useState('')

  if (!T) return <div>Loading…</div>

  // Helper: kan ik paringen genereren?
  function canGen(roundNumber: number) {
    if (roundNumber === 1) return true
    const prev = T.rounds.find((r) => r.ronde_nummer === roundNumber - 1)
    return (
      !!prev &&
      prev.games.every((g) => g.result && g.result !== 'not_played')
    )
  }

  // Bouw de timeline: ronde → (zijn) inhaaldagen
  type Entry =
    | { kind: 'round'; roundNumber: number; roundData?: Round }
    | { kind: 'makeup'; makeup: MakeupDay }

  const timeline: Entry[] = []
  for (let i = 1; i <= T.rondes; i++) {
    timeline.push({
      kind: 'round',
      roundNumber: i,
      roundData: T.rounds.find((r) => r.ronde_nummer === i),
    })
    makeupDays
      .filter((md) => md.round_after === i)
      .forEach((md) => timeline.push({ kind: 'makeup', makeup: md }))
  }

  // Check of alle rondes + partijen klaar zijn
  const allDone =
    T.rounds.length === T.rondes &&
    T.rounds.every((r) =>
      r.games.every((g) => g.result && g.result !== 'not_played')
    )

  // Handlers
  const handleAddMakeup = async () => {
    await createMakeup({
      arg: {
        tournament_id: T.tournament_id,
        round_after: newRoundAfter,
        date: newDate,
        label: newLabel || undefined,
      },
    })
    refetchMD()
    setAddingNew(false)
    toast({ title: 'Success', description: 'Inhaaldag toegevoegd.' })
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-mainAccent">
        Rondes & Inhaaldagen
      </h2>

      {/* === NIEUWE INHAALDAG TOEVOEGEN === */}
      <div className="mb-4">
        {addingNew ? (
          <div className="p-4 bg-gray-50 border rounded space-y-4">
            <div>
              <Label>Na ronde</Label>
              <Select
                value={newRoundAfter.toString()}
                onValueChange={(v) => setNewRoundAfter(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kies ronde" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: T.rondes }, (_, i) => i + 1).map(
                    (n) => (
                      <SelectItem key={n} value={n.toString()}>
                        Ronde {n}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Datum</Label>
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Label (optioneel)</Label>
              <Input
                placeholder="bv. Inhaaldag 1"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
              />
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={handleAddMakeup}
                disabled={creatingMD}
                className="bg-green-600"
              >
                {creatingMD ? 'Opslaan…' : 'Opslaan'}
              </Button>
              <Button variant="outline" onClick={() => setAddingNew(false)}>
                Annuleren
              </Button>
            </div>
          </div>
        ) : (
          <Button
            size="sm"
            onClick={() => setAddingNew(true)}
            data-cy="add-makeup-day-button"
          >
            Inhaaldag toevoegen
          </Button>
        )}
      </div>

      {/* === TIMELINE === */}
      {timeline.map((e, idx) => {
        if (e.kind === 'round') {
          return (
            <RoundSection
              key={`r${e.roundNumber}`}
              roundNumber={e.roundNumber}
              roundData={e.roundData}
              tournamentId={T.tournament_id}
              makeupDays={makeupDays}
              onGenerate={() =>
                genPair({
                  tournamentId: T.tournament_id,
                  roundNumber: e.roundNumber,
                }).then(() => refetchT())
              }
              canGenerate={canGen(e.roundNumber)}
              onUpdate={() => refetchT()}
            />
          )
        } else {
          return (
            <MakeupSection
              key={`m${e.makeup.id}`}
              makeup={e.makeup}
              rounds={T.rounds}
              onUpdate={() => Promise.all([refetchT(), refetchMD()])}
            />
          )
        }
      })}

      {/* === TOERNOOI BEËINDIGEN === */}
      {allDone && !T.finished && (
        <Button
          onClick={() =>
            endT({ arg: T.tournament_id })
              .then(() => Promise.all([refetchT(), refetchMD()]))
              .then(() =>
                toast({
                  title: 'Success',
                  description: 'Toernooi beëindigd.',
                })
              )
              .catch(() =>
                toast({
                  title: 'Error',
                  description: 'Kon toernooi niet beëindigen',
                  variant: 'destructive',
                })
              )
          }
          disabled={ending}
          className="mt-4 bg-red-600 hover:bg-red-700"
          data-cy="end_tournament_button"
        >
          {ending ? 'Even geduld…' : 'Eindig Toernooi'}
        </Button>
      )}
    </div>
  )
}
