"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  AlertCircle,
  Archive,
  Calendar,
  Swords,
  Star,
  Table2,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import MegaschaakHeader from "./MegaschaakHeader";
import { MegaschaakTeamEditor } from "./MegaschaakTeamEditor";
import { useMegaschaakPage } from "./useMegaschaakPage";
import { CrossTableView } from "./views/CrossTableView";
import { MyTeamsOverview } from "./views/MyTeamsOverview";
import { PopularPlayersView } from "./views/PopularPlayersView";
import { StandingsView } from "./views/StandingsView";
import { ValuePlayersView } from "./views/ValuePlayersView";

export default function MegaschaakPage() {
  const m = useMegaschaakPage();

  if (m.tournamentLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mainAccent mx-auto mb-4" />
          <p className="text-gray-600">Megaschaak laden...</p>
        </div>
      </div>
    );
  }

  if (!m.displayTournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
        <div className="bg-white shadow-sm border-b border-neutral-200">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-6 flex items-center gap-3">
            <div className="bg-mainAccent/10 p-3 rounded-xl">
              <Swords className="h-8 w-8 text-mainAccent" />
            </div>
            <h1 className="text-3xl font-bold text-textColor">Megaschaak</h1>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Swords className="h-10 w-10 text-mainAccent mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">
              Geen Megaschaak Toernooi Gevonden
            </h2>
            <p className="text-gray-600 mb-6">
              Er is nog geen megaschaak-toernooi ingesteld.
            </p>
            <Link href="/toernooien">
              <Button className="bg-mainAccent hover:bg-mainAccentDark">
                <Calendar className="h-4 w-4 mr-2" />
                Bekijk Toernooien
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (m.playersLoading && m.needsPlayerList) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
        <p className="text-gray-600">Spelers laden...</p>
      </div>
    );
  }

  const editorProps = {
    displayTournament: m.displayTournament,
    isViewingArchive: m.isViewingArchive,
    myTeams: m.myTeams,
    standings: m.standings,
    isCreatingNew: m.isCreatingNew,
    setIsCreatingNew: m.setIsCreatingNew,
    currentEditingTeam: m.currentEditingTeam,
    setCurrentEditingTeam: m.setCurrentEditingTeam,
    teamName: m.teamName,
    setTeamName: m.setTeamName,
    selectedPlayers: m.selectedPlayers,
    setSelectedPlayers: m.setSelectedPlayers,
    reservePlayer: m.reservePlayer,
    setReservePlayer: m.setReservePlayer,
    searchTerm: m.searchTerm,
    setSearchTerm: m.setSearchTerm,
    playersByClass: m.playersByClass,
    totalCost: m.totalCost,
    remainingBudget: m.remainingBudget,
    isPlayerSelected: m.isPlayerSelected,
    canAddPlayer: m.canAddPlayer,
    addPlayer: m.addPlayer,
    removePlayer: m.removePlayer,
    setAsReserve: m.setAsReserve,
    handleSaveTeam: m.handleSaveTeam,
    handleNewTeam: m.handleNewTeam,
    handleSelectTeam: m.handleSelectTeam,
    handleDeleteTeam: m.handleDeleteTeam,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      <div className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-6">
          <MegaschaakHeader
            tournamentName={m.displayTournament.naam}
            archiveList={m.archiveList}
            selectedArchiveId={m.selectedArchiveId}
            currentTournamentId={m.displayTournament.tournament_id}
            onSelectArchive={(id) => {
              const currentItem = m.archiveList.find((item) => item.is_current);
              if (currentItem && id === currentItem.tournament_id) {
                m.setSelectedArchiveId(null);
              } else {
                m.setSelectedArchiveId(id);
                m.setActiveView("standings");
              }
            }}
          />
        </div>
      </div>

      {m.isViewingArchive && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-7xl mx-auto px-6 py-2.5">
            <p className="text-sm text-amber-900 flex items-center gap-2">
              <Archive className="h-4 w-4 shrink-0" />
              Archiefweergave — alleen stand en statistieken.
            </p>
          </div>
        </div>
      )}

      {!m.isViewingArchive && (
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-12 py-3 sm:py-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 text-xs sm:text-sm text-gray-700 space-y-1.5">
              <p>
                <strong>•</strong> Ploeg max. <strong>1000 punten</strong>,{" "}
                <strong>10 schakers</strong>, reservespeler max.{" "}
                <strong>100 punten</strong>
              </p>
              <p>
                <strong>•</strong> Winst 1 pt, remise 0,5 pt -- deelname €2,50
                per ploeg
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-12 flex gap-1 overflow-x-auto">
          <TabBtn
            active={m.activeView === "team"}
            onClick={() => m.setActiveView("team")}
            icon={<Users className="h-4 w-4" />}
            label="Mijn Team"
          />
          {m.isRegistrationClosed && (
            <>
              <TabBtn
                active={m.activeView === "standings"}
                onClick={() => m.setActiveView("standings")}
                icon={<Trophy className="h-4 w-4" />}
                label="Stand"
              />
              <TabBtn
                active={m.activeView === "crosstable"}
                onClick={() => m.setActiveView("crosstable")}
                icon={<Table2 className="h-4 w-4" />}
                label="Kruistabel"
              />
              <TabBtn
                active={m.activeView === "value"}
                onClick={() => m.setActiveView("value")}
                icon={<Zap className="h-4 w-4" />}
                label="Beste Waarde"
              />
              <TabBtn
                active={m.activeView === "popular"}
                onClick={() => m.setActiveView("popular")}
                icon={<Star className="h-4 w-4" />}
                label="Populairste"
              />
            </>
          )}
        </div>
      </div>

      <div
        className={`${m.activeView === "crosstable" ? "max-w-[95vw]" : "max-w-7xl"} mx-auto px-6 sm:px-8 lg:px-12 py-8`}
      >
        {!m.isRegistrationClosed && m.activeView !== "team" ? (
          <div className="text-center py-12 text-gray-500">
            <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            Deze tab is alleen beschikbaar na de deadline.
          </div>
        ) : m.activeView === "popular" ? (
          <PopularPlayersView
            players={m.popularPlayersData?.items || []}
            isLoading={m.popularPlayersLoading}
          />
        ) : m.activeView === "value" ? (
          <ValuePlayersView
            players={m.valuePlayersData?.items || []}
            isLoading={m.valuePlayersLoading}
          />
        ) : m.activeView === "crosstable" ? (
          <CrossTableView
            data={m.crossTableData}
            isLoading={m.crossTableLoading}
          />
        ) : m.activeView === "standings" ? (
          <StandingsView
            standings={m.standings}
            isLoading={m.standingsLoading}
          />
        ) : m.isRegistrationClosed && m.myTeams.length > 0 ? (
          <MyTeamsOverview myTeams={m.myTeams} standings={m.standings} />
        ) : m.isRegistrationClosed &&
          m.myTeams.length === 0 &&
          m.activeView === "team" ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <div className="text-sm text-red-700">
              Deadline verstreken op{" "}
              <strong>
                {format(
                  new Date(m.displayTournament.megaschaak_deadline!),
                  "dd/MM/yyyy 'om' HH:mm",
                )}
              </strong>
              . Geen teams ingediend.
            </div>
          </div>
        ) : (
          <MegaschaakTeamEditor {...editorProps} />
        )}
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap ${
        active
          ? "text-mainAccent border-mainAccent"
          : "text-gray-500 border-transparent hover:text-gray-700"
      }`}
    >
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
    </button>
  );
}
