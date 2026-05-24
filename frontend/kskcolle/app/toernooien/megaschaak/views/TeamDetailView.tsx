"use client";
import * as React from "react";
import Link from "next/link";
import {
  createUrlFriendlyName,
  getDisplayedTeamPlayerCount,
  isJesseVaerendonck,
} from "../utils";

export function TeamDetailView({ teamDetails }: { teamDetails: any }) {
  const rounds = teamDetails.rounds || [];

  // Calculate number of played rounds (rounds where at least one player has a score)
  const playedRounds = React.useMemo(() => {
    const roundsWithScores = new Set<number>();
    teamDetails.players?.forEach((player: any) => {
      player.roundScores?.forEach((rs: any) => {
        if (rs.score !== null && rs.score !== undefined) {
          roundsWithScores.add(rs.ronde_nummer);
        }
      });
    });
    return roundsWithScores.size;
  }, [teamDetails.players]);

  return (
    <div className="space-y-6">
      {/* Team Summary */}
      <div className="bg-mainAccent/10 rounded-lg p-2">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-xl font-bold text-mainAccent">
              {getDisplayedTeamPlayerCount(teamDetails.players.length)}
            </div>
            <div className="text-xs text-gray-600">Spelers</div>
          </div>
          <div>
            <div className="text-xl font-bold text-mainAccent">
              {playedRounds}
            </div>
            <div className="text-xs text-gray-600">Rondes</div>
          </div>
          <div>
            <div className="text-xl font-bold text-mainAccent">
              {teamDetails.players
                .reduce((sum: number, p: any) => sum + p.totalScore, 0)
                .toFixed(1)}
            </div>
            <div className="text-xs text-gray-600">Totaal Punten</div>
          </div>
        </div>
      </div>

      {/* Players Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-700 sticky left-0 bg-gray-100 z-10">
                Speler
              </th>
              {rounds.map((round: number) => (
                <th
                  key={round}
                  className="px-1.5 py-1.5 text-center text-xs font-semibold text-gray-700"
                >
                  R{round}
                </th>
              ))}
              <th className="px-2 py-1.5 text-center text-xs font-semibold text-mainAccent bg-mainAccent/10">
                Totaal
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {teamDetails.players
              .sort((a: any, b: any) => b.totalScore - a.totalScore)
              .map((playerData: any, idx: number) => (
                <tr
                  key={playerData.id}
                  className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td
                    className="px-2 py-1.5 text-xs font-medium text-gray-800 sticky left-0 z-10"
                    style={{
                      backgroundColor:
                        idx % 2 === 0 ? "white" : "rgb(249, 250, 251)",
                    }}
                  >
                    <Link
                      href={`/profile/${createUrlFriendlyName(playerData.player.voornaam, playerData.player.achternaam)}`}
                      className="text-gray-800 hover:text-mainAccent transition-colors block"
                    >
                      {playerData.player.voornaam}{" "}
                      {playerData.player.achternaam}
                      {teamDetails.reserve_player_id ===
                        playerData.player.user_id && (
                        <span className="text-[10px] text-blue-700 ml-1">
                          (reserve)
                        </span>
                      )}
                      {teamDetails.reserve_player_id &&
                        teamDetails.reserve_player_id !==
                          playerData.player.user_id &&
                        isJesseVaerendonck(
                          playerData.player.voornaam,
                          playerData.player.achternaam,
                        ) && (
                          <span className="text-[10px] text-amber-700 ml-1">
                            (vervangen)
                          </span>
                        )}{" "}
                      {playerData.cost !== undefined &&
                        `(${playerData.cost} pts)`}
                    </Link>
                    <div className="text-[10px] text-gray-500">
                      {playerData.player.schaakrating_elo}
                    </div>
                  </td>
                  {rounds.map((round: number) => {
                    const roundScore = playerData.roundScores?.find(
                      (rs: any) => rs.ronde_nummer === round,
                    );
                    const score = roundScore?.score ?? null;
                    const isForfeitLoss = roundScore?.isForfeitLoss === true;
                    const isBye = roundScore?.isBye === true;
                    return (
                      <td
                        key={round}
                        className="px-1.5 py-1.5 text-center text-xs"
                      >
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded ${
                            isBye
                              ? "bg-blue-100 text-blue-800 font-semibold"
                              : isForfeitLoss
                                ? "bg-gray-300 text-gray-700"
                                : score === 1
                                  ? "bg-green-100 text-green-800 font-semibold"
                                  : score === 0.5
                                    ? "bg-yellow-100 text-yellow-800"
                                    : score === 0
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-50 text-gray-400"
                          }`}
                        >
                          {isBye
                            ? "BYE"
                            : score !== null
                              ? score.toFixed(1)
                              : "-"}
                        </span>
                      </td>
                    );
                  })}
                  <td className="px-2 py-1.5 text-center bg-mainAccent/5">
                    <span className="text-sm font-bold text-mainAccent">
                      {playerData.totalScore.toFixed(1)}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
          <tfoot>
            <tr className="bg-mainAccent/10 font-bold">
              <td className="px-2 py-1.5 text-xs text-gray-800 sticky left-0 bg-mainAccent/10 z-10">
                Team Totaal
              </td>
              {rounds.map((round: number) => {
                const roundTotal = teamDetails.players.reduce(
                  (sum: number, p: any) => {
                    const roundScore = p.roundScores?.find(
                      (rs: any) => rs.ronde_nummer === round,
                    );
                    return sum + (roundScore?.score || 0);
                  },
                  0,
                );
                return (
                  <td
                    key={round}
                    className="px-1.5 py-1.5 text-center text-xs text-gray-800"
                  >
                    {roundTotal.toFixed(1)}
                  </td>
                );
              })}
              <td className="px-2 py-1.5 text-center bg-mainAccent/20">
                <span className="text-base font-bold text-mainAccent">
                  {teamDetails.players
                    .reduce((sum: number, p: any) => sum + p.totalScore, 0)
                    .toFixed(1)}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
