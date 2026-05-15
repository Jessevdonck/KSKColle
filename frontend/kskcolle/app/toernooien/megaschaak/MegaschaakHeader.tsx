"use client";

import { Archive, Swords } from "lucide-react";

export type MegaschaakArchiveItem = {
  tournament_id: number;
  naam: string;
  finished: boolean;
  megaschaak_deadline: string | null;
  team_count: number;
  is_current: boolean;
};

type MegaschaakHeaderProps = {
  tournamentName: string;
  archiveList: MegaschaakArchiveItem[];
  selectedArchiveId: number | null;
  currentTournamentId: number;
  onSelectArchive: (tournamentId: number) => void;
};

export default function MegaschaakHeader({
  tournamentName,
  archiveList,
  selectedArchiveId,
  currentTournamentId,
  onSelectArchive,
}: MegaschaakHeaderProps) {
  const pickerValue =
    selectedArchiveId ??
    archiveList.find((item) => item.is_current)?.tournament_id ??
    currentTournamentId;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="bg-mainAccent/10 p-3 rounded-xl shrink-0">
          <Swords className="h-8 w-8 text-mainAccent" />
        </div>
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-textColor">Megaschaak</h1>
          <p className="text-gray-600 mt-1 truncate">{tournamentName}</p>
        </div>
      </div>
      {archiveList.length > 0 && (
        <div className="sm:ml-auto flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
          <label
            htmlFor="megaschaak-archive"
            className="text-sm font-medium text-gray-700 flex items-center gap-1.5 shrink-0"
          >
            <Archive className="h-4 w-4 text-mainAccent" />
          </label>
          <select
            id="megaschaak-archive"
            value={pickerValue}
            onChange={(e) => onSelectArchive(Number(e.target.value))}
            className="w-full sm:w-auto min-w-[12rem] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-mainAccent focus:outline-none focus:ring-1 focus:ring-mainAccent"
          >
            {archiveList.map((item) => (
              <option key={item.tournament_id} value={item.tournament_id}>
                {item.naam}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
