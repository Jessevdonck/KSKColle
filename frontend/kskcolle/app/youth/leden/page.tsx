import PlayerRanking from "../../spelers/components/PlayerRanking"

export default function YouthMembersPage() {
  return (
    <PlayerRanking
      apiPath="users/publicYouth"
      pageTitle="Jeugdleden — clubrating"
      registeredCountLabel="jeugdleden in de lijst"
      sortHint="Gesorteerd op ELIO rating"
      tableTitle="Jeugdleden (clubrating)"
    />
  )
}
