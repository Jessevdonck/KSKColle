"use client"
import { useState } from "react"
import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { getById, postMakeupDay, getAll, getAllTournamentRounds, createMakeupRound, deleteMakeupRound, addGameToMakeupRound, updateMakeupRoundDate, postponeGameToMakeupRound, deleteById, undoAdminPostponeGame } from "../../../api/index"
import type { Toernooi, MakeupDay, Round } from "@/data/types"
import RoundSection from "./RoundSection"
import MakeupSection from "./MakeupSection"
import RoundExport from "./RoundExport"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Plus, Trophy, CheckCircle, Clock, Users, Gamepad2, X } from "lucide-react"
import { sortGamesByPairingOrder, sortSevillaGamesWithPostponed } from "@/lib/gameSorting"

const getByeText = (result: string | null) => {
  if (!result) return "Bye"
  if (result.startsWith("ABS-")) return "Abs with msg"
  return "Bye"
}

interface Props {
  tournament: Toernooi
}

export default function RoundManagement({ tournament }: Props) {
  const { toast } = useToast()

  // 1) Fetch toernooi + rondes
  const { data: T, mutate: refetchT } = useSWR<Toernooi>(`tournament/${tournament.tournament_id}`, () =>
    getById(`tournament/${tournament.tournament_id}`),
  )

  // 2) Fetch alle inhaaldagen (oude systeem) - niet meer gebruikt
  // const { data: makeupDays = [], mutate: refetchMD } = useSWR<MakeupDay[]>(
  //   ["makeupDay", tournament.tournament_id],
  //   () => getAll(`makeupDay?tournament_id=${tournament.tournament_id}`),
  // )

  // 3) Fetch alle rondes (nieuwe systeem voor inhaaldagen als rondes)
  const { data: allRounds = [], mutate: refetchRounds } = useSWR<Round[]>(
    ["tournamentRounds", tournament.tournament_id],
    () => getAllTournamentRounds(tournament.tournament_id),
    { revalidateOnFocus: false }
  )

  // 4) Mutations
  const { trigger: createMakeup, isMutating: creatingMD } = useSWRMutation("makeupDay", postMakeupDay)
  const { trigger: createMakeupRoundMutation, isMutating: creatingMakeupRound } = useSWRMutation("tournamentRounds", createMakeupRound)
  const { trigger: deleteMakeupRoundMutation, isMutating: deletingMakeupRound } = useSWRMutation("tournamentRounds", deleteMakeupRound)
  const { trigger: addGameMutation, isMutating: addingGame } = useSWRMutation("tournamentRounds", addGameToMakeupRound)
  const { trigger: updateDateMutation, isMutating: updatingDate } = useSWRMutation("tournamentRounds", updateMakeupRoundDate)
  const { trigger: postponeGameMutation, isMutating: postponingGameMutation } = useSWRMutation("tournamentRounds", postponeGameToMakeupRound)
  const { trigger: deleteGameMutation, isMutating: deletingGame } = useSWRMutation("spel", deleteById)
  const { trigger: undoAdminPostponeMutation, isMutating: undoingPostpone } = useSWRMutation("tournamentRounds", undoAdminPostponeGame)

  // Form-state voor nieuwe inhaaldag (oude systeem)
  const [addingNew, setAddingNew] = useState(false)
  const [newRoundAfter, setNewRoundAfter] = useState(1)
  const [newDate, setNewDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [newStartuur, setNewStartuur] = useState("20:00")
  const [newLabel, setNewLabel] = useState("")

  // Form-state voor nieuwe inhaaldag ronde (nieuwe systeem)
  const [addingNewRound, setAddingNewRound] = useState(false)
  const [newRoundAfterRound, setNewRoundAfterRound] = useState(1)
  const [newDateRound, setNewDateRound] = useState(format(new Date(), "yyyy-MM-dd"))
  const [newStartuurRound, setNewStartuurRound] = useState("20:00")

  // Form-state voor het toevoegen van games aan inhaaldagen
  const [addingGameToRound, setAddingGameToRound] = useState<number | null>(null)
  const [newGameSpeler1, setNewGameSpeler1] = useState("")
  const [newGameSpeler2, setNewGameSpeler2] = useState("")
  const [newGameResult, setNewGameResult] = useState("")

  // Form-state voor het bewerken van inhaaldag datums
  const [editingRoundDate, setEditingRoundDate] = useState<number | null>(null)
  const [editDate, setEditDate] = useState("")
  const [editStartuur, setEditStartuur] = useState("")

  // Form-state voor het uitstellen van games
  const [postponingGame, setPostponingGame] = useState<number | null>(null)
  const [selectedMakeupRound, setSelectedMakeupRound] = useState<number | null>(null)
  const [selectedGames, setSelectedGames] = useState<Set<number>>(new Set())
  const [bulkPostponeMode, setBulkPostponeMode] = useState(false)

  if (!T) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mainAccent mx-auto mb-4"></div>
        <p className="text-gray-600">Toernooi wordt geladen...</p>
      </div>
    )
  }

  // Bepaal of dit een Sevilla toernooi is (heeft geïmporteerde rondes)
  const isSevillaTournament = allRounds.some(r => r.is_sevilla_imported)
  
  // Sorteer rondes: eerst op datum, dan op ronde_nummer
  const sortedRounds = allRounds.sort((a, b) => {
    // First sort by date
    const dateA = new Date(a.ronde_datum).getTime()
    const dateB = new Date(b.ronde_datum).getTime()
    if (dateA !== dateB) {
      return dateA - dateB
    }
    // If dates are equal, sort by ronde_nummer
    return a.ronde_nummer - b.ronde_nummer
  })

  // Tel verschillende types rondes
  const sevillaRounds = sortedRounds.filter(r => r.is_sevilla_imported)
  const makeupRounds = sortedRounds.filter(r => r.type === 'MAKEUP')
  const regularRounds = sortedRounds.filter(r => r.type === 'REGULAR' && !r.is_sevilla_imported)


  // timeline bouwen (alleen nieuwe systeem)
  type Entry = { kind: "round"; roundNumber: number; roundData?: Round } | { kind: "makeupRound"; round: Round }

  const timeline: Entry[] = []
  for (let i = 1; i <= T.rondes; i++) {
    timeline.push({ kind: "round", roundNumber: i, roundData: T.rounds.find((r) => r.ronde_nummer === i) })
    // Alleen nieuwe makeup rounds - zoek op basis van round_after (ronde_nummer - 1000)
    allRounds.filter((r) => r.type === 'MAKEUP' && (r.ronde_nummer - 1000) === i).forEach((round) => timeline.push({ kind: "makeupRound", round }))
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

  // handler voor nieuwe inhaaldag (nu als ronde entiteit)
  const handleAddMakeup = async () => {
    try {
      await createMakeupRoundMutation({
        arg: {
          tournament_id: T.tournament_id,
          after_round_number: newRoundAfter,
          date: newDate,
          startuur: newStartuur,
          label: newLabel || undefined,
        },
      })
      refetchRounds()
      setAddingNew(false)
      toast({ title: "Success", description: "Inhaaldag toegevoegd." })
    } catch (error) {
      toast({ title: "Error", description: "Kon inhaaldag niet toevoegen", variant: "destructive" })
    }
  }

  // Bereken standaard datum voor inhaaldag (1 week na de geselecteerde ronde)
  const calculateDefaultMakeupDate = (afterRoundNumber: number) => {
    const afterRound = sortedRounds.find(r => r.ronde_nummer === afterRoundNumber)
    if (afterRound) {
      const afterRoundDate = new Date(afterRound.ronde_datum)
      afterRoundDate.setDate(afterRoundDate.getDate() + 7) // 1 week later
      return format(afterRoundDate, "yyyy-MM-dd")
    }
    return format(new Date(), "yyyy-MM-dd")
  }

  // Update datum wanneer ronde wordt geselecteerd
  const handleRoundAfterChange = (roundNumber: number) => {
    setNewRoundAfterRound(roundNumber)
    setNewDateRound(calculateDefaultMakeupDate(roundNumber))
  }

  // handler voor nieuwe inhaaldag ronde (nieuwe systeem)
  const handleAddMakeupRound = async () => {
    try {
      await createMakeupRoundMutation({
        arg: {
          tournament_id: T.tournament_id,
          after_round_number: newRoundAfterRound,
          date: newDateRound,
          startuur: newStartuurRound,
        },
      })
      refetchRounds()
      setAddingNewRound(false)
      toast({ title: "Success", description: "Inhaaldag ronde toegevoegd." })
    } catch (error) {
      toast({ title: "Error", description: "Kon inhaaldag ronde niet toevoegen", variant: "destructive" })
    }
  }

  // handler voor verwijderen inhaaldag ronde
  const handleDeleteMakeupRound = async (roundId: number) => {
    try {
      
      await deleteMakeupRoundMutation({
        roundId
      })
      refetchRounds()
      toast({ title: "Success", description: "Inhaaldag ronde verwijderd." })
    } catch (error) {
      console.error('Error in handleDeleteMakeupRound:', error);
      toast({ title: "Error", description: "Kon inhaaldag ronde niet verwijderen", variant: "destructive" })
    }
  }

  // handler voor toevoegen game aan inhaaldag
  const handleAddGameToRound = async (roundId: number) => {
    try {
      // Zoek speler IDs op basis van namen
      const speler1 = T.participations.find(p => 
        `${p.user.voornaam} ${p.user.achternaam}`.toLowerCase().includes(newGameSpeler1.toLowerCase())
      )
      const speler2 = newGameSpeler2 ? T.participations.find(p => 
        `${p.user.voornaam} ${p.user.achternaam}`.toLowerCase().includes(newGameSpeler2.toLowerCase())
      ) : null

      if (!speler1) {
        toast({ title: "Error", description: "Speler 1 niet gevonden", variant: "destructive" })
        return
      }

      await addGameMutation({
        round_id: roundId,
        speler1_id: speler1.user_id,
        speler2_id: speler2?.user_id || null,
        result: newGameResult || undefined,
      })
      
      refetchRounds()
      setAddingGameToRound(null)
      setNewGameSpeler1("")
      setNewGameSpeler2("")
      setNewGameResult("")
      toast({ title: "Success", description: "Game toegevoegd aan inhaaldag." })
    } catch (error) {
      toast({ title: "Error", description: "Kon game niet toevoegen", variant: "destructive" })
    }
  }

  // handler voor het bewerken van inhaaldag datum
  const handleEditRoundDate = (round: Round) => {
    setEditingRoundDate(round.round_id)
    setEditDate(format(new Date(round.ronde_datum), "yyyy-MM-dd"))
    setEditStartuur(round.startuur)
  }

  const handleSaveRoundDate = async (roundId: number) => {
    try {
      await updateDateMutation({
        arg: {
          round_id: roundId,
          date: editDate,
          startuur: editStartuur,
        }
      })
      
      refetchRounds()
      setEditingRoundDate(null)
      setEditDate("")
      setEditStartuur("")
      toast({ title: "Success", description: "Datum bijgewerkt." })
    } catch (error) {
      toast({ title: "Error", description: "Kon datum niet bijwerken", variant: "destructive" })
    }
  }

  // handler voor het uitstellen van games
  const handlePostponeGame = async (gameId: number) => {
    if (!selectedMakeupRound) {
      toast({ title: "Error", description: "Selecteer eerst een inhaaldag", variant: "destructive" })
      return
    }

    try {
      await postponeGameMutation({
        arg: {
          game_id: gameId,
          makeup_round_id: selectedMakeupRound,
        },
      })
      
      refetchRounds()
      setPostponingGame(null)
      setSelectedMakeupRound(null)
      toast({ title: "Success", description: "Game uitgesteld naar inhaaldag." })
    } catch (error) {
      toast({ title: "Error", description: "Kon game niet uitstellen", variant: "destructive" })
    }
  }

  // handler voor bulk uitstellen van games
  const handleBulkPostponeGames = async () => {
    if (!selectedMakeupRound || selectedGames.size === 0) {
      toast({ title: "Error", description: "Selecteer eerst games en een inhaaldag", variant: "destructive" })
      return
    }

    try {
      const promises = Array.from(selectedGames).map(gameId => 
        postponeGameMutation({
          arg: {
            game_id: gameId,
            makeup_round_id: selectedMakeupRound,
          },
        })
      )
      
      await Promise.all(promises)
      refetchRounds()
      setSelectedGames(new Set())
      setBulkPostponeMode(false)
      setSelectedMakeupRound(null)
      toast({ title: "Success", description: `${selectedGames.size} games uitgesteld naar inhaaldag.` })
    } catch (error) {
      toast({ title: "Error", description: "Kon games niet uitstellen", variant: "destructive" })
    }
  }

  // handler voor het selecteren/deselecteren van games
  const toggleGameSelection = (gameId: number) => {
    const newSelected = new Set(selectedGames)
    if (newSelected.has(gameId)) {
      newSelected.delete(gameId)
    } else {
      newSelected.add(gameId)
    }
    setSelectedGames(newSelected)
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{T.rounds.length}</div>
              <div className="text-sm text-blue-600">Gegenereerde Rondes</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{makeupRounds.length}</div>
              <div className="text-sm text-green-600">Inhaaldagen</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{T.participations.length}</div>
              <div className="text-sm text-purple-600">Deelnemers</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{T.rounds.filter(r => r.is_sevilla_imported).length}</div>
              <div className="text-sm text-orange-600">Sevilla Rondes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Makeup Day (Oude systeem voor niet-Sevilla toernooien) */}
      {!isSevillaTournament && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Inhaaldag Toevoegen (Oude Systeem)
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
                    <Label className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Startuur
                    </Label>
                    <Input 
                      type="time" 
                      value={newStartuur} 
                      onChange={(e) => setNewStartuur(e.target.value)}
                      defaultValue="20:00"
                    />
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
      )}

      {/* Add Makeup Round (Nieuwe systeem voor Sevilla toernooien) */}
      {isSevillaTournament && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Inhaaldag Ronde Toevoegen (Nieuwe Systeem)
            </h3>
          </div>
          <div className="p-6">
            {addingNewRound ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      Na ronde
                    </Label>
                    <Select value={newRoundAfterRound.toString()} onValueChange={(v) => handleRoundAfterChange(Number(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Kies ronde" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: Math.max(...sortedRounds.map(r => r.ronde_nummer), 0) }, (_, i) => i + 1).map((n) => (
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
                    <Input type="date" value={newDateRound} onChange={(e) => setNewDateRound(e.target.value)} />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Startuur
                    </Label>
                    <Input 
                      type="time" 
                      value={newStartuurRound} 
                      onChange={(e) => setNewStartuurRound(e.target.value)}
                      defaultValue="20:00"
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleAddMakeupRound} disabled={creatingMakeupRound} className="bg-green-600 hover:bg-green-700">
                    {creatingMakeupRound ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Opslaan...
                      </div>
                    ) : (
                      "Opslaan"
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setAddingNewRound(false)}>
                    Annuleren
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setAddingNewRound(true)}
                className="bg-mainAccent hover:bg-mainAccentDark"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nieuwe Inhaaldag Ronde
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Timeline (Oude systeem voor niet-Sevilla toernooien) */}
      {!isSevillaTournament && (
        <div className="space-y-6">
          {timeline.map((e) => {
            if (e.kind === "round") {
              return (
                <RoundSection
                  key={`r${e.roundNumber}`}
                  roundNumber={e.roundNumber}
                  roundData={e.roundData}
                  tournamentId={T.tournament_id}
                  tournamentName={T.naam}
                  makeupRounds={makeupRounds.map(r => ({
                    round_id: r.round_id,
                    ronde_datum: new Date(r.ronde_datum).toISOString().split('T')[0], // Convert to date string
                    startuur: r.startuur,
                    label: r.label
                  }))}
                  participations={T.participations}
                  isSevillaImported={e.roundData?.is_sevilla_imported || false}
                  onUpdate={() => refetchT()}
                />
              )
            } else if (e.kind === "makeupRound") {
              // Render nieuwe makeup round als een speciale sectie
              return (
                <div key={`mr${e.round.round_id}`} className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-200 to-orange-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-amber-800 flex items-center gap-2">
                        <div className="bg-amber-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                          I
                        </div>
                        {e.round.label || `Inhaaldag na ronde ${e.round.ronde_nummer - 1}`}
                      </h3>
                      <div className="text-amber-700 text-sm">
                        {format(new Date(e.round.ronde_datum), 'dd/MM/yyyy')} om {e.round.startuur}
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="text-center py-4 text-amber-600 text-sm">
                      {e.round.games?.length || 0} games in deze inhaaldag
                    </div>
                  </div>
                </div>
              )
            }
          })}
        </div>
      )}

      {/* Rondes Timeline (Nieuwe systeem voor Sevilla toernooien) */}
      {isSevillaTournament && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-textColor flex items-center gap-2">
            <Gamepad2 className="h-5 w-5" />
            Alle Rondes ({sortedRounds.length})
          </h3>
          
          {sortedRounds.map((round) => (
            <div key={round.round_id} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className={`px-6 py-4 ${
                round.type === 'MAKEUP' 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
                  : round.is_sevilla_imported 
                    ? 'bg-gradient-to-r from-mainAccent to-mainAccentDark'
                    : 'bg-gradient-to-r from-gray-500 to-gray-600'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      {round.type === 'MAKEUP' ? (
                        <Users className="h-5 w-5 text-white" />
                      ) : (
                        <Trophy className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white">
                        {round.type === 'MAKEUP' 
                          ? (round.label || `Inhaaldag na ronde ${round.ronde_nummer - 1}`)
                          : `Ronde ${round.ronde_nummer}`
                        }
                      </h4>
                      <div className="text-white/80 text-sm">
                        {editingRoundDate === round.round_id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="date"
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              className="text-black text-sm w-32"
                            />
                            <Input
                              type="time"
                              value={editStartuur}
                              onChange={(e) => setEditStartuur(e.target.value)}
                              className="text-black text-sm w-24"
                            />
                            <Button
                              onClick={() => handleSaveRoundDate(round.round_id)}
                              disabled={updatingDate}
                              size="sm"
                              className="bg-white/30 hover:bg-white/40 text-white border border-white/50"
                            >
                              {updatingDate ? "..." : "Opslaan"}
                            </Button>
                            <Button
                              onClick={() => setEditingRoundDate(null)}
                              variant="outline"
                              size="sm"
                              className="border-white/50 text-white hover:bg-white/20 bg-white/10"
                            >
                              Annuleren
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <p>Speeldatum: {format(new Date(round.ronde_datum), 'dd/MM/yyyy')} om {round.startuur}</p>
                            {round.type === 'MAKEUP' && (
                              <Button
                                onClick={() => handleEditRoundDate(round)}
                                size="sm"
                                variant="outline"
                                className="border-white/50 text-white hover:bg-white/20 bg-white/10 text-xs"
                              >
                                Bewerken
                              </Button>
                            )}
                          </div>
                        )}
                        {round.is_sevilla_imported && (
                          <p className="text-white/60 text-xs">Sevilla geïmporteerd</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {round.type === 'MAKEUP' && (
                      <Button
                        onClick={() => handleDeleteMakeupRound(round.round_id)}
                        disabled={deletingMakeupRound}
                        variant="outline"
                        className="border-white/50 text-white hover:bg-white/30 bg-white/10"
                      >
                        {deletingMakeupRound ? "..." : "Verwijderen"}
                      </Button>
                    )}
                    
                    {round.games.length > 0 && (
                      <RoundExport
                        tournamentId={tournament.tournament_id}
                        roundId={round.round_id}
                        roundNumber={round.ronde_nummer}
                        tournamentName={tournament.naam}
                        isSevillaImported={round.is_sevilla_imported || false}
                        className="border-white/50 text-white hover:bg-white/30 bg-white/10"
                      />
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-700">{round.games.length}</div>
                    <div className="text-sm text-gray-600">Games</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-700">
                      {round.games.filter(g => g.result && g.result !== 'not_played').length}
                    </div>
                    <div className="text-sm text-gray-600">Voltooid</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-700">
                      {round.games.filter(g => !g.result || g.result === 'not_played').length}
                    </div>
                    <div className="text-sm text-gray-600">Open</div>
                  </div>
                </div>


                {/* Games sectie */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-semibold text-gray-700">Games ({round.games.length})</h5>
                    <div className="flex gap-2">
                      {round.type === 'MAKEUP' && makeupRounds.length === 0 && (
                        <Button
                          onClick={() => setAddingGameToRound(round.round_id)}
                          size="sm"
                          className="bg-mainAccent hover:bg-mainAccentDark"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Game Toevoegen
                        </Button>
                      )}
                      {round.type === 'REGULAR' && makeupRounds.length > 0 && (
                        <Button
                          onClick={() => setBulkPostponeMode(!bulkPostponeMode)}
                          size="sm"
                          variant={bulkPostponeMode ? "default" : "outline"}
                          className={bulkPostponeMode ? "bg-mainAccent hover:bg-mainAccentDark" : ""}
                        >
                          {bulkPostponeMode ? "Annuleren" : "Games Uitstellen"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Game toevoegen form */}
                  {addingGameToRound === round.round_id && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
                      <h6 className="font-medium text-gray-700 mb-3">Nieuwe Game Toevoegen</h6>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <Label className="text-sm">Speler 1</Label>
                          <Input
                            placeholder="Zoek speler..."
                            value={newGameSpeler1}
                            onChange={(e) => setNewGameSpeler1(e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Speler 2 (optioneel)</Label>
                          <Input
                            placeholder="Zoek speler..."
                            value={newGameSpeler2}
                            onChange={(e) => setNewGameSpeler2(e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Resultaat</Label>
                          <Select value={newGameResult} onValueChange={setNewGameResult}>
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Kies resultaat" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1-0">1-0 (Wit wint)</SelectItem>
                              <SelectItem value="0-1">0-1 (Zwart wint)</SelectItem>
                              <SelectItem value="1/2-1/2">1/2-1/2 (Remise)</SelectItem>
                              <SelectItem value="not_played">Nog niet gespeeld</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-end gap-2">
                          <Button
                            onClick={() => handleAddGameToRound(round.round_id)}
                            disabled={addingGame || !newGameSpeler1}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {addingGame ? "..." : "Toevoegen"}
                          </Button>
                          <Button
                            onClick={() => {
                              setAddingGameToRound(null)
                              setNewGameSpeler1("")
                              setNewGameSpeler2("")
                              setNewGameResult("")
                            }}
                            variant="outline"
                            size="sm"
                          >
                            Annuleren
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bulk uitstellen controls */}
                  {bulkPostponeMode && round.type === 'REGULAR' && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <h6 className="font-medium text-blue-800">
                          {selectedGames.size} game{selectedGames.size !== 1 ? 's' : ''} geselecteerd
                        </h6>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleBulkPostponeGames}
                            disabled={selectedGames.size === 0 || !selectedMakeupRound}
                            size="sm"
                            className="bg-mainAccent hover:bg-mainAccentDark"
                          >
                            Uitstellen naar Inhaaldag
                          </Button>
                          <Button
                            onClick={() => {
                              setBulkPostponeMode(false)
                              setSelectedGames(new Set())
                              setSelectedMakeupRound(null)
                            }}
                            variant="outline"
                            size="sm"
                          >
                            Annuleren
                          </Button>
                        </div>
                      </div>
                      {makeupRounds.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {makeupRounds.map((makeupRound) => (
                            <Button
                              key={makeupRound.round_id}
                              onClick={() => setSelectedMakeupRound(makeupRound.round_id)}
                              size="sm"
                              variant={selectedMakeupRound === makeupRound.round_id ? "default" : "outline"}
                              className={selectedMakeupRound === makeupRound.round_id ? "bg-mainAccent hover:bg-mainAccentDark" : ""}
                            >
                              {makeupRound.label || `Inhaaldag na ronde ${makeupRound.ronde_nummer - 1}`}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bestaande games */}
                  {round.games.length > 0 ? (
                    <div className="space-y-2">
                      {(round.is_sevilla_imported 
                        ? sortSevillaGamesWithPostponed(round.games)
                        : sortGamesByPairingOrder(round.games, round.is_sevilla_imported)).map((game, index) => (
                        <div 
                          key={index} 
                          className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                            bulkPostponeMode && round.type === 'REGULAR'
                              ? selectedGames.has(game.game_id)
                                ? 'bg-mainAccent/20 border-2 border-mainAccent'
                                : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100 cursor-pointer'
                              : 'bg-gray-50'
                          }`}
                          onClick={() => {
                            if (bulkPostponeMode && round.type === 'REGULAR') {
                              toggleGameSelection(game.game_id)
                            }
                          }}
                        >
                          <div className="flex items-center gap-3">
                            {bulkPostponeMode && round.type === 'REGULAR' && (
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                selectedGames.has(game.game_id)
                                  ? 'bg-mainAccent border-mainAccent'
                                  : 'border-gray-300'
                              }`}>
                                {selectedGames.has(game.game_id) && (
                                  <div className="w-2 h-2 bg-white rounded-sm"></div>
                                )}
                              </div>
                            )}
                            <span className="font-medium">
                              {game.speler1 ? `${game.speler1.voornaam} ${game.speler1.achternaam}` : 'Onbekend'}
                            </span>
                            <span className="text-gray-500">vs</span>
                            <span className="font-medium">
                              {game.speler2 ? `${game.speler2.voornaam} ${game.speler2.achternaam}` : getByeText(game.result)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm text-gray-600">
                              {game.uitgestelde_datum ? 'Uitgesteld' : 
                               game.result ? (game.result.startsWith("ABS-") ? "Abs with msg" : game.result) : 'Nog niet gespeeld'}
                            </div>
                            {!bulkPostponeMode && round.type === 'REGULAR' && makeupRounds.length > 0 && (
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setPostponingGame(game.game_id)
                                }}
                                size="sm"
                                variant="outline"
                                className="text-xs"
                              >
                                Uitstellen
                              </Button>
                            )}
                            {round.type === 'MAKEUP' && (
                              <Button
                                onClick={async (e) => {
                                  e.stopPropagation()
                                  const gameId = game.game_id
                                  if (!gameId) {
                                    toast({ title: "Error", description: "Kon game ID niet vinden", variant: "destructive" })
                                    return
                                  }
                                  if (confirm(`Weet je zeker dat je deze partij wilt verwijderen?\n\n${game.speler1?.voornaam} ${game.speler1?.achternaam} vs ${game.speler2 ? `${game.speler2.voornaam} ${game.speler2.achternaam}` : 'Bye'}`)) {
                                    try {
                                      // Als deze game een original_game_id heeft, betekent het dat het een uitgestelde partij is
                                      // In dat geval moeten we de originele partij herstellen
                                      if ((game as any).original_game_id) {
                                        await undoAdminPostponeMutation({ 
                                          original_game_id: (game as any).original_game_id, 
                                          new_game_id: Number(gameId) 
                                        })
                                        toast({ title: "Success", description: "Partij verwijderd en originele partij hersteld." })
                                      } else {
                                        // Geen original_game_id, gewoon verwijderen (handmatig toegevoegde partij)
                                        await deleteGameMutation(Number(gameId))
                                        toast({ title: "Success", description: "Partij verwijderd." })
                                      }
                                      refetchRounds()
                                    } catch (error) {
                                      console.error('Error deleting game:', error)
                                      toast({ title: "Error", description: "Kon partij niet verwijderen", variant: "destructive" })
                                    }
                                  }
                                }}
                                size="sm"
                                variant="ghost"
                                disabled={deletingGame || undoingPostpone}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                                title="Verwijder partij"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      {round.type === 'MAKEUP' ? 'Nog geen games toegevoegd aan deze inhaaldag' : 'Geen games beschikbaar'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}


      {/* Game Uitstellen Modal */}
      {postponingGame && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Game Uitstellen</h3>
            <p className="text-gray-600 mb-4">
              Selecteer naar welke inhaaldag je deze game wilt uitstellen:
            </p>
            
            <div className="space-y-2 mb-4">
              {makeupRounds.map((makeupRound) => (
                <div
                  key={makeupRound.round_id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedMakeupRound === makeupRound.round_id
                      ? 'border-mainAccent bg-mainAccent/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedMakeupRound(makeupRound.round_id)}
                >
                  <div className="font-medium">
                    {makeupRound.label || `Inhaaldag na ronde ${makeupRound.ronde_nummer - 1}`}
                  </div>
                  <div className="text-sm text-gray-600">
                    {format(new Date(makeupRound.ronde_datum), 'dd/MM/yyyy')} om {makeupRound.startuur}
                  </div>
                </div>
              ))}
            </div>

            {makeupRounds.length === 0 && (
              <p className="text-gray-500 text-sm mb-4">
                Er zijn nog geen inhaaldagen aangemaakt. Maak eerst een inhaaldag aan.
              </p>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => handlePostponeGame(postponingGame)}
                disabled={!selectedMakeupRound || postponingGameMutation}
                className="bg-mainAccent hover:bg-mainAccentDark"
              >
                {postponingGameMutation ? "Uitstellen..." : "Uitstellen"}
              </Button>
              <Button
                onClick={() => {
                  setPostponingGame(null)
                  setSelectedMakeupRound(null)
                }}
                variant="outline"
              >
                Annuleren
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}