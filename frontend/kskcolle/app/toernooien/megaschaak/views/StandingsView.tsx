"use client";
import * as React from "react";
import Link from "next/link";
import { Trophy, Medal, ChevronRight } from "lucide-react";
import { createUrlFriendlyName } from "../utils";
import { useMegaschaakTeamDetails } from "../useMegaschaakTeamDetails";
import { TeamDetailView } from "./TeamDetailView";

export function StandingsView({
  standings,
  isLoading,
}: {
  standings: any[];
  isLoading: boolean;
}) {
  const [expandedTeamId, setExpandedTeamId] = React.useState<number | null>(
    null,
  );

  const { data: expandedTeamDetails } =
    useMegaschaakTeamDetails(expandedTeamId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mainAccent mx-auto mb-4"></div>
          <p className="text-gray-600">Stand laden...</p>
        </div>
      </div>
    );
  }

  if (standings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Nog geen teams
        </h3>
        <p className="text-gray-500">
          Er zijn nog geen teams aangemaakt voor dit toernooi.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-w-4xl mx-auto">
      {/* Leaderboard */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-3 py-2">
          {/* Header row aligned like data rows: [rank][team info][stats] */}
          <div className="flex items-center gap-3">
            {/* Rank placeholder (same width as rank column) */}
            <div className="flex-shrink-0 w-8 flex items-center justify-center">
              <Trophy className="h-4 w-4 text-white" />
            </div>

            {/* Title in place of team info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-white">Klassement</h2>
            </div>

            {/* Column headers for stats */}
            <div className="hidden sm:flex items-center gap-3 flex-shrink-0 text-[10px] sm:text-xs font-semibold text-white/90">
              <span className="w-16 text-right sm:w-20">Totaalprijs</span>
              <span className="w-12 text-right">Partijen</span>
              <span className="w-12 text-right">Punten</span>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {standings.map((team, index) => (
            <div key={team.team_id}>
              <div
                onClick={() =>
                  setExpandedTeamId(
                    expandedTeamId === team.team_id ? null : team.team_id,
                  )
                }
                className="px-3 py-1 hover:bg-gray-50 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3">
                  {/* Rank */}
                  <div className="flex-shrink-0">
                    {index === 0 ? (
                      <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                        <Medal className="h-4 w-4 text-white" />
                      </div>
                    ) : index === 1 ? (
                      <div className="w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center">
                        <Medal className="h-4 w-4 text-white" />
                      </div>
                    ) : index === 2 ? (
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                        <Medal className="h-4 w-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600 text-sm">
                        {index + 1}
                      </div>
                    )}
                  </div>

                  {/* Team Info */}
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm text-gray-800 group-hover:text-mainAccent transition-colors">
                        {team.team_name}
                      </h3>
                      <span className="text-[10px] text-gray-500">•</span>
                      <Link
                        href={`/profile/${createUrlFriendlyName(team.user.voornaam, team.user.achternaam)}`}
                        className="text-xs text-gray-600 hover:text-mainAccent transition-colors"
                      >
                        {team.user.voornaam} {team.user.achternaam}
                      </Link>
                    </div>
                  </div>

                  {/* Score, Partijen, Cost */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right w-16 sm:w-20">
                      <div className="text-sm font-semibold text-gray-700">
                        {team.totalCost || 0} pts
                      </div>
                    </div>
                    <div className="text-right w-12">
                      <div className="text-sm font-semibold text-gray-700">
                        {team.gamesPlayed ?? 0}
                      </div>
                    </div>
                    <div className="text-right w-12">
                      <div className="text-base sm:text-md font-bold text-mainAccent leading-tight">
                        {team.totalScore.toFixed(1)}
                      </div>
                    </div>
                    <ChevronRight
                      className={`h-4 w-4 transition-all ${
                        expandedTeamId === team.team_id
                          ? "rotate-90 text-mainAccent"
                          : "text-gray-400 group-hover:text-mainAccent"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Expanded Team Details */}
              {expandedTeamId === team.team_id && (
                <div className="border-t border-gray-200 bg-gray-50 p-3">
                  {expandedTeamDetails ? (
                    <TeamDetailView teamDetails={expandedTeamDetails} />
                  ) : (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-mainAccent"></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
