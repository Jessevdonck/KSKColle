"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import type { MegaschaakTeam } from "@/data/types";
import { getDisplayedTeamPlayerCount } from "../utils";
import { useMegaschaakTeamDetails } from "../useMegaschaakTeamDetails";
import { TeamDetailView } from "./TeamDetailView";

export function MyTeamsOverview({
  myTeams,
  standings,
}: {
  myTeams: MegaschaakTeam[];
  standings: any[];
}) {
  const [expandedTeamId, setExpandedTeamId] = React.useState<number | null>(
    null,
  );

  const { data: expandedTeamDetails } =
    useMegaschaakTeamDetails(expandedTeamId);

  return (
    <div className="space-y-6">
      {/* Teams Grid */}
      <div className="space-y-4">
        {myTeams.map((team) => {
          // Find team in standings to get score and position
          const teamStanding = standings.find(
            (s: any) => s.team_id === team.team_id,
          );
          const position = teamStanding
            ? standings.indexOf(teamStanding) + 1
            : null;
          const score = teamStanding?.totalScore ?? 0;

          return (
            <div
              key={team.team_id}
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
            >
              <div
                onClick={() =>
                  setExpandedTeamId(
                    expandedTeamId === team.team_id ? null : team.team_id,
                  )
                }
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-lg text-gray-800">
                      {team.team_name}
                    </h3>
                    {position !== null && (
                      <>
                        <span className="text-sm font-semibold text-mainAccent">
                          #{position}
                        </span>
                        <span className="text-sm font-semibold text-gray-700">
                          {score.toFixed(1)} pts
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {getDisplayedTeamPlayerCount(team.players.length)} spelers
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-mainAccent text-mainAccent"
                >
                  {expandedTeamId === team.team_id
                    ? "Inklappen"
                    : "Bekijk Details"}
                </Button>
              </div>

              {expandedTeamId === team.team_id && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  {expandedTeamDetails ? (
                    <TeamDetailView teamDetails={expandedTeamDetails} />
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mainAccent"></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
