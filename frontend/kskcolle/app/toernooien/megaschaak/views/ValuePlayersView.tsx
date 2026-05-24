"use client";
import Link from "next/link";
import { Zap, HelpCircle } from "lucide-react";
import { createUrlFriendlyName } from "../utils";

export function ValuePlayersView({
  players,
  isLoading,
}: {
  players: any[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mainAccent mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Spelers laden...</p>
        </div>
      </div>
    );
  }

  if (!players || players.length === 0) {
    return (
      <div className="text-center py-8">
        <Zap className="h-12 w-12 text-gray-300 mx-auto mb-2" />
        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          Geen Data Beschikbaar
        </h3>
        <p className="text-sm text-gray-500">
          Er zijn nog geen wedstrijden gespeeld in dit toernooi.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-4 py-2">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Beste Waarde Spelers
        </h2>
        <p className="text-xs text-white/80">Meeste punten per budget punt</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-gray-600 uppercase">
                #
              </th>
              <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-gray-600 uppercase">
                Speler
              </th>
              <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-gray-600 uppercase">
                Klasse
              </th>
              <th className="px-2 py-1.5 text-center text-[10px] font-semibold text-gray-600 uppercase">
                Elio
              </th>
              <th className="px-2 py-1.5 text-center text-[10px] font-semibold text-gray-600 uppercase">
                Kost
              </th>
              <th className="px-2 py-1.5 text-center text-[10px] font-semibold text-gray-600 uppercase">
                Punten
              </th>
              <th className="px-2 py-1.5 text-center text-[10px] font-semibold text-gray-600 uppercase">
                Games
              </th>
              <th className="px-2 py-1.5 text-center text-[10px] font-semibold text-gray-600 bg-mainAccent/10 relative">
                <div className="flex items-center justify-center gap-1">
                  <span>Ratio</span>
                  <div className="relative group">
                    <HelpCircle className="h-3 w-3 text-gray-400 cursor-help" />
                    <div className="absolute top-full right-0 mt-2 hidden group-hover:block z-[100] pointer-events-none">
                      <div className="bg-white border border-gray-200 text-gray-700 text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                        <p className="font-medium text-mainAccent">
                          Behaalde punten / kost
                        </p>
                        <div className="absolute bottom-full right-4 mb-px">
                          <div className="border-[6px] border-transparent border-b-white"></div>
                          <div
                            className="absolute bottom-0 right-0 border-[6px] border-transparent border-b-gray-200"
                            style={{ marginBottom: "1px" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {players.map((player, index) => (
              <tr
                key={player.user_id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-2 py-1.5">
                  <div className="text-sm font-bold text-gray-600">
                    {index + 1}
                  </div>
                </td>
                <td className="px-2 py-1.5">
                  <Link
                    href={`/profile/${createUrlFriendlyName(player.voornaam, player.achternaam)}`}
                    className="font-semibold text-gray-800 hover:text-mainAccent transition-colors block"
                  >
                    {player.voornaam} {player.achternaam}
                  </Link>
                </td>
                <td className="px-2 py-1.5">
                  <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">
                    {player.className}
                  </span>
                </td>
                <td className="px-2 py-1.5 text-center text-gray-600">
                  {player.schaakrating_elo}
                </td>
                <td className="px-2 py-1.5 text-center">
                  <span className="font-semibold text-gray-800">
                    {player.cost}
                  </span>
                </td>
                <td className="px-2 py-1.5 text-center">
                  <span className="font-semibold text-mainAccent">
                    {player.totalScore.toFixed(1)}
                  </span>
                </td>
                <td className="px-2 py-1.5 text-center text-gray-600">
                  {player.gamesPlayed}
                </td>
                <td className="px-2 py-1.5 text-center bg-mainAccent/5">
                  <span className="text-sm font-bold text-mainAccent">
                    {player.valueRatio.toFixed(3)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
