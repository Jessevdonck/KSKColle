import { mutate } from "swr"

/** Zelfde key voor admin en publiek — anders ververst de ene pagina de cache van de andere niet. */
export function tournamentRoundsKey(tournamentId: number) {
  return ["tournamentRounds", tournamentId] as const
}

export function tournamentDetailKey(tournamentId: number) {
  return `tournament/${tournamentId}` as const
}

/** Na wijzigingen aan spellen/rondes: toernooi + rondes opnieuw ophalen. */
export function revalidateTournamentData(tournamentId: number) {
  return Promise.all([
    mutate(tournamentDetailKey(tournamentId)),
    mutate(tournamentRoundsKey(tournamentId)),
  ])
}
