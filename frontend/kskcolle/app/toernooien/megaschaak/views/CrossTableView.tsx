"use client";
import Link from "next/link";
import { Table2 } from "lucide-react";
import { createUrlFriendlyName, sortClassEntries } from "../utils";

export function CrossTableView({
  data,
  isLoading,
}: {
  data: any;
  isLoading: boolean;
}) {
  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mainAccent mx-auto mb-4"></div>
          <p className="text-gray-600">Kruistabel laden...</p>
        </div>
      </div>
    );
  }

  if (!data.teams || data.teams.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <Table2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Nog geen teams
        </h3>
        <p className="text-gray-500">
          Er zijn nog geen teams aangemaakt voor dit toernooi.
        </p>
      </div>
    );
  }

  const { teams, players } = data;

  // Group players by class for headers
  const playersByClass = players.reduce((acc: any, player: any) => {
    const className = player.className || "Hoofdtoernooi";
    if (!acc[className]) {
      acc[className] = [];
    }
    acc[className].push(player);
    return acc;
  }, {});

  const sortedClassEntries = sortClassEntries(
    Object.entries(playersByClass) as [string, unknown[]][],
  );

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-4 py-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Table2 className="h-5 w-5" />
          Kruistabel Megaschaak
        </h2>
        <p className="text-xs text-white/80 mt-1">
          {teams.length} teams • {players.length} spelers
        </p>
      </div>

      <div className="pt-3 pr-3 pb-3 overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            {/* Class headers */}
            <tr>
              <th className="sticky left-0 z-20 bg-white border-b-2 border-mainAccent"></th>
              <th className="px-1.5 py-1.5 text-center bg-mainAccent/20 border-b-2 border-mainAccent font-bold text-mainAccent border-r border-mainAccent">
                Totaal
              </th>
              <th className="px-1.5 py-1.5 text-center bg-mainAccent/10 border-b-2 border-mainAccent font-bold text-mainAccent border-r-2 border-mainAccent">
                Partijen
              </th>
              {sortedClassEntries.map(
                (
                  [className, classPlayers]: [string, any],
                  classIdx: number,
                ) => (
                  <th
                    key={className}
                    colSpan={(classPlayers as any[]).length}
                    className={`px-1 py-1 text-center bg-mainAccent/10 border-b-2 border-mainAccent text-mainAccent font-bold text-xs ${
                      classIdx > 0 ? "border-l-2 border-l-mainAccent" : ""
                    }`}
                  >
                    {className}
                  </th>
                ),
              )}
            </tr>
            {/* Player headers */}
            <tr className="bg-gray-50">
              <th className="sticky left-0 z-20 bg-gray-50 px-2 py-2 text-left font-semibold text-gray-700 border-r-2 border-gray-300">
                Team
              </th>
              <th className="px-1.5 py-2 text-center font-semibold text-gray-700 bg-gray-100 border-r border-mainAccent">
                Score
              </th>
              <th className="px-1.5 py-2 text-center font-semibold text-gray-700 bg-gray-100 border-r-2 border-mainAccent">
                Partijen
              </th>
              {players.map((player: any, playerIdx: number) => {
                // Check if this is the first player of a new class
                const isFirstInClass =
                  playerIdx === 0 ||
                  players[playerIdx - 1].className !== player.className;
                return (
                  <th
                    key={player.user_id}
                    className={`px-0.5 py-2 text-center font-medium text-gray-700 border-r border-gray-200 ${
                      isFirstInClass ? "border-l-2 border-l-mainAccent" : ""
                    }`}
                    style={{ width: "35px", minWidth: "35px", height: "80px" }}
                  >
                    <div className="flex items-center justify-center h-full">
                      <div
                        className="text-[9px] leading-tight"
                        style={{
                          writingMode: "vertical-rl",
                          textOrientation: "mixed",
                          transform: "rotate(180deg)",
                        }}
                      >
                        <Link
                          href={`/profile/${createUrlFriendlyName(player.voornaam, player.achternaam)}`}
                          className="hover:text-mainAccent transition-colors inline-block"
                          title={`${player.voornaam} ${player.achternaam}`}
                        >
                          <span className="whitespace-nowrap">
                            {player.voornaam.substring(0, 1)}.{" "}
                            {player.achternaam}
                          </span>
                        </Link>
                        {player.cost !== undefined && (
                          <div className="text-[8px] text-gray-500 mt-0.5 whitespace-nowrap">
                            ({player.cost} pts)
                          </div>
                        )}
                        {(player.gamesPlayed ?? 0) >= 0 && (
                          <div className="text-[8px] text-gray-500 mt-0.5 whitespace-nowrap">
                            {player.gamesPlayed} p
                          </div>
                        )}
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {teams.map((team: any, idx: number) => (
              <tr
                key={team.team_id}
                className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td
                  className="sticky left-0 z-10 px-2 py-2 font-semibold text-gray-800 border-r-2 border-gray-300 text-xs whitespace-nowrap"
                  style={{
                    backgroundColor:
                      idx % 2 === 0 ? "white" : "rgb(249, 250, 251)",
                  }}
                >
                  <div>{team.team_name}</div>
                  {team.user?.voornaam && team.user?.achternaam && (
                    <div className="text-[10px] text-gray-600 font-normal mt-0.5">
                      {team.user.voornaam} {team.user.achternaam}
                    </div>
                  )}
                  <div className="text-[9px] text-gray-500 font-normal mt-0.5">
                    {team.totalCost || 0} pts
                  </div>
                </td>
                <td
                  className="px-1.5 py-2 text-center font-bold text-mainAccent bg-mainAccent/5 border-r border-mainAccent"
                  style={{
                    backgroundColor:
                      idx % 2 === 0
                        ? "rgba(212, 175, 55, 0.05)"
                        : "rgba(212, 175, 55, 0.1)",
                  }}
                >
                  {team.totalScore.toFixed(1)}
                </td>
                <td
                  className="px-1.5 py-2 text-center text-gray-700 bg-gray-50 border-r-2 border-mainAccent font-medium"
                  style={{
                    backgroundColor:
                      idx % 2 === 0
                        ? "rgb(249, 250, 251)"
                        : "rgb(243, 244, 246)",
                  }}
                >
                  {team.gamesPlayed ?? 0}
                </td>
                {team.playerScores.map((ps: any, playerIdx: number) => {
                  const score = ps.score;
                  // Check if this is the first player of a new class
                  const isFirstInClass =
                    playerIdx === 0 ||
                    players[playerIdx - 1].className !==
                      players[playerIdx].className;

                  return (
                    <td
                      key={ps.player_id}
                      className={`px-0.5 py-2 text-center border-r border-gray-200 ${
                        isFirstInClass ? "border-l-2 border-l-mainAccent" : ""
                      }`}
                    >
                      {ps.inTeam ? (
                        <span
                          className={`inline-block px-1 py-0.5 rounded text-[10px] font-semibold ${
                            score === null || score === 0
                              ? "bg-red-100 text-red-800"
                              : score >= 1
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {score !== null ? score.toFixed(1) : "0.0"}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-[10px]">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
