"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Clock,
  Plus,
  Save,
  Search,
  Trash2,
  TrendingUp,
  Trophy,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MegaschaakPlayer, MegaschaakTeam, Toernooi } from "@/data/types";
import { MAX_BUDGET, MAX_PLAYERS, MIN_PLAYERS } from "./constants";
import { createUrlFriendlyName, getDisplayedTeamPlayerCount, isJesseVaerendonck } from "./utils";
export type MegaschaakTeamEditorProps = {
  displayTournament: Toernooi;
  isViewingArchive: boolean;
  myTeams: MegaschaakTeam[];
  standings: any[];
  isCreatingNew: boolean;
  setIsCreatingNew: (v: boolean) => void;
  currentEditingTeam: MegaschaakTeam | null;
  setCurrentEditingTeam: (t: MegaschaakTeam | null) => void;
  teamName: string;
  setTeamName: (n: string) => void;
  selectedPlayers: MegaschaakPlayer[];
  setSelectedPlayers: React.Dispatch<React.SetStateAction<MegaschaakPlayer[]>>;
  reservePlayer: MegaschaakPlayer | null;
  setReservePlayer: (p: MegaschaakPlayer | null) => void;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  playersByClass: [string, MegaschaakPlayer[]][];
  totalCost: number;
  remainingBudget: number;
  isPlayerSelected: (id: number) => boolean;
  canAddPlayer: (p: MegaschaakPlayer) => boolean;
  addPlayer: (p: MegaschaakPlayer) => void;
  removePlayer: (id: number) => void;
  setAsReserve: (p: MegaschaakPlayer) => void;
  handleSaveTeam: () => Promise<void>;
  handleNewTeam: () => void;
  handleSelectTeam: (team: MegaschaakTeam) => void;
  handleDeleteTeam: (teamId: number, name: string) => Promise<void>;
};

export function MegaschaakTeamEditor({
  displayTournament,
  isViewingArchive,
  myTeams,
  standings,
  isCreatingNew,
  setIsCreatingNew,
  currentEditingTeam,
  setCurrentEditingTeam,
  teamName,
  setTeamName,
  selectedPlayers,
  reservePlayer,
  setReservePlayer,
  searchTerm,
  setSearchTerm,
  playersByClass,
  totalCost,
  remainingBudget,
  isPlayerSelected,
  canAddPlayer,
  addPlayer,
  removePlayer,
  setAsReserve,
  handleSaveTeam,
  handleNewTeam,
  handleSelectTeam,
  handleDeleteTeam,
}: MegaschaakTeamEditorProps) {
  return (
    <div className="space-y-6">
      {/* Deadline Info Banner */}
      {displayTournament?.megaschaak_deadline && !isViewingArchive && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-800 mb-1">
              Inschrijvingsdeadline
            </h3>
            <p className="text-sm text-blue-700">
              Je hebt tot{" "}
              <strong>
                {format(
                  new Date(displayTournament.megaschaak_deadline),
                  "dd/MM/yyyy 'om' HH:mm",
                )}
              </strong>{" "}
              om je team samen te stellen. Je kan je team blijven
              aanpassen tot de deadline.
            </p>
          </div>
        </div>
      )}

      {/* Team Selector */}
      {myTeams.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">
              Jouw Teams ({myTeams.length})
            </h3>
            <Button
              onClick={handleNewTeam}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Nieuw Team
            </Button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
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
                <button
                  key={team.team_id}
                  onClick={() => handleSelectTeam(team)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg border-2 transition-all ${
                    currentEditingTeam?.team_id === team.team_id &&
                    !isCreatingNew
                      ? "border-mainAccent bg-mainAccent/10 text-mainAccent font-semibold"
                      : "border-gray-200 bg-white hover:border-mainAccent/50"
                  }`}
                >
                  <div className="text-sm font-medium">
                    {team.team_name}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {position !== null && (
                      <>
                        <div className="text-xs font-semibold text-mainAccent">
                          #{position}
                        </div>
                        <div className="text-xs text-gray-400">•</div>
                      </>
                    )}
                    <div className="text-xs font-semibold text-gray-700">
                      {score.toFixed(1)} pts
                    </div>
                    <div className="text-xs text-gray-400">•</div>
                    <div className="text-xs text-gray-500">
                      {getDisplayedTeamPlayerCount(team.players.length)}{" "}
                      spelers
                    </div>
                  </div>
                </button>
              );
            })}
            {isCreatingNew && (
              <div className="flex-shrink-0 px-4 py-2 rounded-lg border-2 border-green-500 bg-green-50 text-green-700">
                <div className="text-sm font-semibold">Nieuw Team</div>
                <div className="text-xs">Aan het maken...</div>
              </div>
            )}
          </div>
          {currentEditingTeam && !isCreatingNew && (
            <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
              <p className="text-xs text-gray-600">
                Bewerk: <strong>{currentEditingTeam.team_name}</strong>
              </p>
              <Button
                onClick={() =>
                  handleDeleteTeam(
                    currentEditingTeam.team_id,
                    currentEditingTeam.team_name,
                  )
                }
                size="sm"
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Verwijder
              </Button>
            </div>
          )}
        </div>
      )}

      {myTeams.length === 0 && !isCreatingNew && (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">
            Je hebt nog geen team aangemaakt
          </p>
          <Button
            onClick={handleNewTeam}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Maak je Eerste Team
          </Button>
        </div>
      )}

      {/* Budget Info */}
      {(myTeams.length > 0 || isCreatingNew) && (
        <>
          <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark rounded-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="h-6 w-6" />
              <h2 className="text-xl font-bold">
                {isCreatingNew
                  ? "Nieuw Team Samenstellen"
                  : `Bewerk: ${currentEditingTeam?.team_name || "Team"}`}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-5 w-5" />
                  <span className="text-sm opacity-80">Spelers</span>
                </div>
                <div className="text-2xl font-bold">
                  {selectedPlayers.length} / {MAX_PLAYERS}
                </div>
                <div className="text-xs text-white">
                  {MIN_PLAYERS} of {MAX_PLAYERS} spelers vereist
                </div>
              </div>

              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-sm opacity-80">
                    Budget Gebruikt
                  </span>
                </div>
                <div className="text-2xl font-bold">
                  {totalCost} / {MAX_BUDGET}
                </div>
              </div>

              <div
                className={`rounded-lg p-4 ${remainingBudget < 0 ? "bg-red-500/30" : "bg-white/10"}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="h-5 w-5" />
                  <span className="text-sm opacity-80">Resterend</span>
                </div>
                <div className="text-2xl font-bold">
                  {remainingBudget}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Speler Selectie */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Search className="h-5 w-5 text-mainAccent" />
                  Beschikbare Spelers
                </h3>
                <Input
                  type="text"
                  placeholder="Zoek spelers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {playersByClass.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm
                      ? "Geen spelers gevonden"
                      : "Geen spelers beschikbaar"}
                  </div>
                ) : (
                  playersByClass.map(
                    ([className, players], classIndex) => {
                      // Calculate color intensity based on class index (darker to lighter)
                      const getClassColor = (index: number) => {
                        const intensities = [
                          "bg-mainAccent/15 border-mainAccent/40", // Hoofdtoernooi - darkest
                          "bg-mainAccent/13 border-mainAccent/35", // Eerste Klasse
                          "bg-mainAccent/11 border-mainAccent/30", // Tweede Klasse
                          "bg-mainAccent/9 border-mainAccent/25", // Derde Klasse
                          "bg-mainAccent/7 border-mainAccent/20", // Vierde Klasse
                          "bg-mainAccent/6 border-mainAccent/18", // Vijfde Klasse
                          "bg-mainAccent/5 border-mainAccent/15", // Zesde Klasse
                          "bg-mainAccent/4 border-mainAccent/12", // Zevende Klasse
                          "bg-mainAccent/3 border-mainAccent/10", // Achtste Klasse - lightest
                        ];
                        return (
                          intensities[index] ||
                          intensities[intensities.length - 1]
                        );
                      };

                      const classColors = getClassColor(classIndex);

                      return (
                        <div key={className} className="space-y-1.5">
                          {/* Class Header */}
                          <div className="sticky top-0 bg-gradient-to-r from-mainAccent to-mainAccentDark text-white px-3 py-1.5 rounded-md shadow-sm z-10">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-sm">
                                {className}
                              </h4>
                              <span className="text-xs opacity-80">
                                {players.length} spelers
                              </span>
                            </div>
                          </div>

                          {/* Players in this class - All info on one line */}
                          {players.map((player) => {
                            const selected = isPlayerSelected(
                              player.user_id,
                            );
                            const canAdd = canAddPlayer(player);
                            const isReserveCandidate = player.cost <= 100;
                            const isSelectedAsReserve =
                              reservePlayer?.user_id === player.user_id;
                            // Keep reserve candidates visible even if team is full
                            const shouldBeVisible =
                              canAdd ||
                              (isReserveCandidate && !reservePlayer) ||
                              isSelectedAsReserve;

                            return (
                              <div
                                key={player.user_id}
                                className={`flex items-center gap-2 px-2 py-1.5 rounded border transition-all ${
                                  selected
                                    ? "bg-green-50 border-green-300"
                                    : isSelectedAsReserve
                                      ? "bg-blue-50 border-blue-300"
                                      : shouldBeVisible
                                        ? `${classColors} hover:shadow-sm`
                                        : "bg-gray-50 border-gray-200 opacity-50"
                                }`}
                              >
                                {/* Player Info - All on one line */}
                                <div className="flex-1 flex items-center gap-3 min-w-0">
                                  <Link
                                    href={`/profile/${createUrlFriendlyName(player.voornaam, player.achternaam)}`}
                                    className="font-medium text-sm text-gray-800 hover:text-mainAccent transition-colors truncate"
                                  >
                                    {player.voornaam} {player.achternaam}
                                  </Link>
                                  <div className="text-xs text-gray-600 flex-shrink-0">
                                    Elo: {player.schaakrating_elo}
                                  </div>
                                  <div className="text-sm font-semibold text-mainAccent flex-shrink-0">
                                    {player.cost} pts
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  {selected ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        removePlayer(player.user_id)
                                      }
                                      className="h-7 px-2 border-red-200 text-red-600 hover:bg-red-50"
                                      title="Verwijder uit team"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  ) : isSelectedAsReserve ? (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded">
                                        Reserve
                                      </span>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          setReservePlayer(null)
                                        }
                                        className="h-7 px-2 border-red-200 text-red-600 hover:bg-red-50"
                                        title="Verwijder reservespeler"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <>
                                      <Button
                                        size="sm"
                                        onClick={() => addPlayer(player)}
                                        disabled={!canAdd}
                                        className="h-7 px-2 bg-mainAccent hover:bg-mainAccentDark disabled:opacity-50"
                                        title="Voeg toe aan team"
                                      >
                                        <Plus className="h-3.5 w-3.5 mr-1" />
                                        <span className="text-xs">
                                          Team
                                        </span>
                                      </Button>
                                      {isReserveCandidate && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            setAsReserve(player)
                                          }
                                          className="h-7 px-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                                          title="Stel in als reservespeler (max 100 pts)"
                                        >
                                          <UserPlus className="h-3.5 w-3.5 mr-1" />
                                          <span className="text-xs">
                                            Reserve
                                          </span>
                                        </Button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    },
                  )
                )}
              </div>
            </div>

            {/* Jouw Team */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-mainAccent" />
                  Jouw Team
                </h3>
                <Input
                  type="text"
                  placeholder="Team naam..."
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full mb-3"
                />
              </div>

              {selectedPlayers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Selecteer spelers om je team samen te stellen</p>
                  <p className="text-sm mt-2">
                    Selecteer {MIN_PLAYERS} of {MAX_PLAYERS} spelers
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5 mb-3">
                    {selectedPlayers.map((player, index) => (
                      <div
                        key={player.user_id}
                        className="flex items-center justify-between p-2 bg-mainAccent/10 border border-mainAccent/30 rounded-lg"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="bg-mainAccent text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {index + 1}
                          </div>
                          <Link
                            href={`/profile/${createUrlFriendlyName(player.voornaam, player.achternaam)}`}
                            className="font-medium text-sm text-gray-800 hover:text-mainAccent transition-colors truncate flex-shrink-0 min-w-[120px]"
                          >
                            {player.voornaam} {player.achternaam}
                          </Link>
                          {reservePlayer?.user_id === player.user_id && (
                            <span className="text-[10px] text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                              (reserve)
                            </span>
                          )}
                          {reservePlayer &&
                            reservePlayer.user_id !== player.user_id &&
                            isJesseVaerendonck(
                              player.voornaam,
                              player.achternaam,
                            ) && (
                              <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                                (vervangen)
                              </span>
                            )}
                          {player.class_name && (
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-white/80 text-mainAccent border border-mainAccent/30 flex-shrink-0">
                              {player.class_name}
                            </span>
                          )}
                          <div className="text-xs text-gray-600 flex-shrink-0">
                            Elo: {player.schaakrating_elo}
                          </div>
                          <div className="text-xs font-semibold text-mainAccent flex-shrink-0">
                            {player.cost} pts
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removePlayer(player.user_id)}
                          className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600 flex-shrink-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Reserve Speler Section */}
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="mb-2 bg-blue-50 rounded-lg p-2 border border-blue-200">
                      <h4 className="text-xs font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                        <UserPlus className="h-4 w-4 text-blue-700" />
                        Reservespeler (max 100 pts)
                      </h4>
                    </div>

                    {reservePlayer ? (
                      <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            R
                          </div>
                          <Link
                            href={`/profile/${createUrlFriendlyName(reservePlayer.voornaam, reservePlayer.achternaam)}`}
                            className="font-medium text-sm text-gray-800 hover:text-mainAccent transition-colors truncate flex-shrink-0 min-w-[120px]"
                          >
                            {reservePlayer.voornaam}{" "}
                            {reservePlayer.achternaam}
                          </Link>
                          <div className="text-xs text-gray-600 flex-shrink-0">
                            Elo: {reservePlayer.schaakrating_elo}
                          </div>
                          <div className="text-xs font-semibold text-mainAccent flex-shrink-0">
                            {reservePlayer.cost} pts
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setReservePlayer(null)}
                          className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600 flex-shrink-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-2 text-gray-500 bg-gray-50 rounded-lg">
                        <p className="text-xs">
                          Geen reservespeler geselecteerd
                        </p>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleSaveTeam}
                    className="w-full bg-mainAccent hover:bg-mainAccentDark mt-4"
                    disabled={remainingBudget < 0}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isCreatingNew
                      ? "Team Aanmaken"
                      : "Wijzigingen Opslaan"}
                  </Button>

                  {remainingBudget < 0 && (
                    <p className="text-red-600 text-sm mt-2 text-center">
                      Budget overschreden! Verwijder spelers.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
