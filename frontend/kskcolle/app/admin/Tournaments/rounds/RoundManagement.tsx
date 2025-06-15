"use client"
import { useState } from "react"
import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { getById, generatePairings, endTournament, postMakeupDay, getAll } from "../../../api/index"
import type { Toernooi, MakeupDay, Round } from "@/data/types"
import RoundSection from "./RoundSection"
import MakeupSection from "./MakeupSection"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Plus, Trophy, CheckCircle } from "lucide-react"

interface Props {
  tournament: Toernooi
}

export default function RoundManagement({ tournament }: Props) {
  const { toast } = useToast()

  // 1) Fetch toernooi + rondes
  const { data: T, mutate: refetchT } = useSWR<Toernooi>(`tournament/${tournament.tournament_id}`, () =>
    getById(`tournament/${tournament.tournament_id}`),
  )

  // 2) Fetch alle inhaaldagen
  const { data: makeupDays = [], mutate: refetchMD } = useSWR<MakeupDay[]>(
    ["makeupDay", tournament.tournament_id],
    () => getAll(`makeupDay?tournament_id=${tournament.tournament_id}`),
  )

  // 3) Mutations
  const { trigger: genPair, isMutating: generatingPairs } = useSWRMutation("tournament", generatePairings)
  const { trigger: endT, isMutating: ending } = useSWRMutation("tournament", endTournament)
  const { trigger: createMakeup, isMutating: creatingMD } = useSWRMutation("makeupDay", postMakeupDay)

  // Form-state voor nieuwe inhaaldag
  const [addingNew, setAddingNew] = useState(false)
  const [newRoundAfter, setNewRoundAfter] = useState(1)
  const [newDate, setNewDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [newLabel, setNewLabel] = useState("")

  if (!T) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mainAccent mx-auto mb-4"></div>
        <p className="text-gray-600">Toernooi wordt geladen...</p>
      </div>
    )
  }

  // aangepaste canGen: negeert spellen met uitgestelde_datum
  function canGen(roundNumber: number) {
    if (roundNumber === 1) return true
    const prev = T.rounds.find((r) => r.ronde_nummer === roundNumber - 1)
    if (!prev) return false
    // alleen de niet-uitgestelde games meepakken
    const pending = prev.games.filter((g) => !g.uitgestelde_datum)
    return pending.every((g) => g.result && g.result !== "not_played")
  }

  // timeline bouwen
  type Entry = { kind: "round"; roundNumber: number; roundData?: Round } | { kind: "makeup"; makeup: MakeupDay }

  const timeline: Entry[] = []
  for (let i = 1; i <= T.rondes; i++) {
    timeline.push({ kind: "round", roundNumber: i, roundData: T.rounds.find((r) => r.ronde_nummer === i) })
    makeupDays.filter((md) => md.round_after === i).forEach((md) => timeline.push({ kind: "makeup", makeup: md }))
  }

  // check of officieel alles klaar is
  const allDone =
    T.rounds.length === T.rondes &&
    T.rounds.every((r) =>
      // ook hier negeren we uitgestelde
      r.games
        .filter((g) => !g.uitgestelde_datum)
        .every((g) => g.result && g.result !== "not_played"),
    )

  // handler voor nieuwe inhaaldag
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
    toast({ title: "Success", description: "Inhaaldag toegevoegd." })
  }

  return (
    <div className="space-y-8">
      {/* Tournament Status */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-6 py-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            Toernooi Status
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{T.rounds.length}</div>
              <div className="text-sm text-blue-600">Gegenereerde Rondes</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{makeupDays.length}</div>
              <div className="text-sm text-green-600">Inhaaldagen</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{T.participations.length}</div>
              <div className="text-sm text-purple-600">Deelnemers</div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Makeup Day */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Inhaaldag Toevoegen
          </h3>
        </div>
        <div className="p-6">
          {addingNew ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Na ronde
                  </Label>
                  <Select value={newRoundAfter.toString()} onValueChange={(v) => setNewRoundAfter(Number(v))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kies ronde" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: T.rondes }, (_, i) => i + 1).map((n) => (
                        <SelectItem key={n} value={n.toString()}>
                          Ronde {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Datum
                  </Label>
                  <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
                </div>
                <div>
                  <Label>Label (optioneel)</Label>
                  <Input placeholder="bv. Inhaaldag 1" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleAddMakeup} disabled={creatingMD} className="bg-green-600 hover:bg-green-700">
                  {creatingMD ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Opslaan...
                    </div>
                  ) : (
                    "Opslaan"
                  )}
                </Button>
                <Button variant="outline" onClick={() => setAddingNew(false)}>
                  Annuleren
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setAddingNew(true)}
              data-cy="add-makeup-day-button"
              className="bg-mainAccent hover:bg-mainAccentDark"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nieuwe Inhaaldag
            </Button>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {timeline.map((e, idx) => {
          if (e.kind === "round") {
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
                isGenerating={generatingPairs}
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
      </div>

      {/* End Tournament */}
      {allDone && !T.finished && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Toernooi Beëindigen
            </h3>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-4">
              Alle rondes zijn voltooid. Je kunt het toernooi nu officieel beëindigen.
            </p>
            <Button
              onClick={() =>
                endT(T.tournament_id)
                  .then(() => Promise.all([refetchT(), refetchMD()]))
                  .then(() => toast({ title: "Success", description: "Toernooi beëindigd." }))
                  .catch(() =>
                    toast({ title: "Error", description: "Kon toernooi niet beëindigen", variant: "destructive" }),
                  )
              }
              disabled={ending}
              className="bg-red-600 hover:bg-red-700"
              data-cy="end_tournament_button"
            >
              {ending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Even geduld...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Eindig Toernooi
                </div>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
