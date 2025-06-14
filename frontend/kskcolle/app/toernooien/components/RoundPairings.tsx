import Link from "next/link"
import { ChevronRight, User } from "lucide-react"

interface RoundPairingsProps {
  round: {
    round_id: number
    ronde_nummer: number
    games?: Array<{
      game_id: number
      speler1: { user_id: number; voornaam: string; achternaam: string }
      speler2: { user_id: number; voornaam: string; achternaam: string } | null
      result: string | null
    }>
  }
}

export default function RoundPairings({ round }: RoundPairingsProps) {
  const createUrlFriendlyName = (voornaam: string, achternaam: string) => {
    return `${voornaam.toLowerCase()}_${achternaam.toLowerCase()}`.replace(/\s+/g, "_")
  }

  if (!round.games || round.games.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-textColor mb-2 flex items-center gap-2">
            <div className="bg-mainAccent text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
              {round.ronde_nummer}
            </div>
            Ronde {round.ronde_nummer}
          </h3>
        </div>

        <div className="text-center py-16">
          <div className="bg-mainAccent/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <User className="h-10 w-10 text-mainAccent" />
          </div>
          <h4 className="text-lg font-semibold text-gray-700 mb-2">Nog geen partijen</h4>
          <p className="text-gray-500">De partijen voor deze ronde zijn nog niet gegenereerd.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-textColor mb-2 flex items-center gap-2">
          <div className="bg-mainAccent text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
            {round.ronde_nummer}
          </div>
          Ronde {round.ronde_nummer}
        </h3>
        <p className="text-gray-600">{round.games.length} partijen</p>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-mainAccent to-mainAccentDark text-white">
              <th className="p-4 text-left font-semibold">Wit</th>
              <th className="p-4 text-center font-semibold w-12"></th>
              <th className="p-4 text-left font-semibold">Zwart</th>
              <th className="p-4 text-center font-semibold">Uitslag</th>
            </tr>
          </thead>
          <tbody>
            {round.games.map((game, index) => (
              <tr
                key={game.game_id}
                className={`border-b border-neutral-100 ${
                  index % 2 === 0 ? "bg-white" : "bg-neutral-50/50"
                } hover:bg-mainAccent/5 transition-colors`}
              >
                <td className="p-4">
                  <Link
                    href={`/profile/${createUrlFriendlyName(game.speler1.voornaam, game.speler1.achternaam)}`}
                    className="font-medium text-textColor hover:text-mainAccent transition-colors flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 bg-white border-2 border-neutral-300 rounded-full flex items-center justify-center text-xs font-bold group-hover:border-mainAccent transition-colors">
                      W
                    </div>
                    {`${game.speler1.voornaam} ${game.speler1.achternaam}`}
                  </Link>
                </td>
                <td className="p-4 text-center">
                  <ChevronRight className="h-4 w-4 text-gray-400 mx-auto" />
                </td>
                <td className="p-4">
                  {game.speler2 ? (
                    <Link
                      href={`/profile/${createUrlFriendlyName(game.speler2.voornaam, game.speler2.achternaam)}`}
                      className="font-medium text-textColor hover:text-mainAccent transition-colors flex items-center gap-3 group"
                    >
                      <div className="w-8 h-8 bg-gray-800 border-2 border-gray-600 rounded-full flex items-center justify-center text-xs font-bold text-white group-hover:border-mainAccent transition-colors">
                        Z
                      </div>
                      {`${game.speler2.voornaam} ${game.speler2.achternaam}`}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 text-gray-500 italic">
                      <div className="w-8 h-8 bg-gray-200 border-2 border-gray-300 rounded-full flex items-center justify-center text-xs">
                        -
                      </div>
                      Bye
                    </div>
                  )}
                </td>
                <td className="p-4 text-center">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      game.result && game.result !== "not_played"
                        ? "bg-green-100 text-green-800 border border-green-200"
                        : "bg-gray-100 text-gray-600 border border-gray-200"
                    }`}
                  >
                    {game.result && game.result !== "not_played" 
                      ? game.result 
                      : "Nog te spelen"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
