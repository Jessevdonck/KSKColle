"use client";
import { Star } from "lucide-react";

export function PopularPlayersView({
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
        <Star className="h-12 w-12 text-gray-300 mx-auto mb-2" />
        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          Geen Data Beschikbaar
        </h3>
        <p className="text-sm text-gray-500">
          Er zijn nog geen teams aangemaakt voor dit toernooi.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-4 py-2">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Star className="h-4 w-4" />
          Populairste Spelers
        </h2>
        <p className="text-xs text-white/80">Meest geselecteerd in teams</p>
      </div>

      <div className="divide-y divide-gray-100">
        {players.map((player, index) => (
          <div
            key={player.user_id}
            className="px-3 py-2 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              {/* Rank */}
              <div className="flex-shrink-0 w-8 text-center">
                <div className="text-lg font-bold text-gray-600">
                  {index + 1}
                </div>
              </div>

              {/* Player Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-gray-800 truncate">
                  {player.voornaam} {player.achternaam}
                </h3>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-600">
                  <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">
                    {player.className}
                  </span>
                  <span>Elo: {player.schaakrating_elo}</span>
                  <span className="font-semibold text-mainAccent">
                    {player.cost}pt
                  </span>
                </div>
              </div>

              {/* Selection Count */}
              <div className="text-right flex-shrink-0">
                <div className="text-xl font-bold text-mainAccent">
                  {player.selectionCount}
                </div>
                <div className="text-[10px] text-gray-500">
                  {player.selectionCount === 1 ? "team" : "teams"}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
