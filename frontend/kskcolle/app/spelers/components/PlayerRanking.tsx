"use client";

import { useMemo, useState } from "react";
import { getAll } from "../../api/index";
import PlayerTable from "./PlayerTable";
import useSWR from "swr";
import AsyncData from "../../components/AsyncData";
import type { User } from "@/data/types";
import { Users, Trophy } from "lucide-react";

/** Actief lid = `lidgeld_betaald` in DB; API stuurt ook `membership_valid` (zelfde betekenis). */
function isActiveMember(u: User): boolean {
  const paid = u.membership_valid ?? u.lidgeld_betaald;
  return paid !== false;
}

export type PlayerRankingProps = {
  /** API-pad onder users/, bv. publicUsers of publicYouth */
  apiPath?: string;
  pageTitle?: string;
  registeredCountLabel?: string;
  sortHint?: string;
  tableTitle?: string;
  /** Titel van de tabel bij uitgebreide weergave (alle leden uit de API: actief + niet-actief met clubrating). */
  fullListTableTitle?: string;
  /** @deprecated Gebruik `fullListTableTitle`. */
  inactiveTableTitle?: string;
  /** Toon schakelaar standaard vs volledige lijst (standaard aan). */
  showMembershipToggle?: boolean;
};

export default function PlayerRanking({
  apiPath = "users/publicUsers",
  pageTitle = "Spelers Ranglijst Clubrating",
  registeredCountLabel = "geregistreerde spelers",
  sortHint = "Gesorteerd op ELIO rating",
  tableTitle = "Ranglijst Clubrating",
  fullListTableTitle,
  inactiveTableTitle,
  showMembershipToggle = true,
}: PlayerRankingProps = {}) {
  const resolvedFullListTitle =
    fullListTableTitle ??
    inactiveTableTitle ??
    "Volledige ranglijst clubrating";

  const {
    data: users = [],
    isLoading,
    error,
  } = useSWR<User[]>(apiPath, () => getAll(apiPath));

  /** Uit = alleen actieve leden; aan = volledige API-lijst (actief + niet-actief met clubrating > 0). */
  const [showFullList, setShowFullList] = useState(false);

  const displayUsers = useMemo(() => {
    if (!showMembershipToggle) return users;
    if (showFullList) return users;
    return users.filter(isActiveMember);
  }, [users, showFullList, showMembershipToggle]);

  const noPlayersError = users.length === 0 && !isLoading && !error;
  const noFilteredPlayers =
    users.length > 0 && displayUsers.length === 0 && !isLoading && !error;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mainAccent mx-auto mb-3"></div>
          <p className="text-gray-600 text-base">Lijst wordt geladen...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-red-500 text-4xl mb-3">⚠️</div>
          <h2 className="text-xl font-bold text-red-600 mb-2">
            Fout bij laden van spelers
          </h2>
          <p className="text-gray-600 text-sm">
            Er is een probleem opgetreden bij het ophalen van de
            spelersgegevens.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-mainAccent/10 p-2 rounded-lg">
              <Users className="h-6 w-6 text-mainAccent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-textColor">{pageTitle}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600 mt-2">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>
                    {displayUsers.length} {registeredCountLabel}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Trophy className="h-3 w-3" />
                  <span>{sortHint}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AsyncData loading={isLoading} error={error}>
          {noPlayersError ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-4 py-3">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Geen Spelers
                </h2>
              </div>
              <div className="p-8 text-center" data-cy="no_users_message">
                <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <Users className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-red-600 mb-2">
                  Geen spelers gevonden
                </h3>
                <p className="text-gray-600 text-sm">
                  Er zijn momenteel geen spelers in de database.
                </p>
              </div>
            </div>
          ) : noFilteredPlayers ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-4 py-3">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Geen resultaten
                </h2>
              </div>
              <div className="p-8 text-center">
                <p className="text-gray-600 text-sm">
                  {showFullList
                    ? "Er zijn geen spelers in deze weergave."
                    : "Er zijn geen actieve leden in deze weergave."}
                </p>
              </div>
            </div>
          ) : (
            <PlayerTable
              users={displayUsers}
              tableTitle={showFullList ? resolvedFullListTitle : tableTitle}
              membershipToggleSlot={
                showMembershipToggle && users.length > 0 ? (
                  <div className="flex items-center space-x-3 shrink-0">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={showFullList}
                      aria-label="Toon volledige ranglijst inclusief niet-actieve leden met clubrating"
                      data-cy="membership_inactive_toggle"
                      onClick={() => setShowFullList(!showFullList)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/80 focus:ring-offset-2 focus:ring-offset-mainAccentDark ${
                        showFullList ? "bg-mainAccent" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          showFullList ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <span className="text-sm font-medium text-white/95 whitespace-nowrap">
                      Alle spelers
                    </span>
                  </div>
                ) : undefined
              }
            />
          )}
        </AsyncData>
      </div>
    </div>
  );
}
