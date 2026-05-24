"use client";

import * as React from "react";
import { useState } from "react";
import useSWR, { mutate as swrGlobalMutate } from "swr";
import { axios } from "../../api/index";
import type { MegaschaakPlayer, MegaschaakTeam, Toernooi } from "@/data/types";
import { isPast } from "date-fns";
import { useAuth } from "../../contexts/auth";
import { DEFAULT_SWR_OPTIONS } from "@/lib/swrConfig";
import type { MegaschaakArchiveItem as MegaschaakArchiveEntry } from "./MegaschaakHeader";
import {
  MAX_BUDGET,
  MAX_PLAYERS,
  MIN_PLAYERS,
  type MegaschaakView,
} from "./constants";
import { CLASS_ORDER } from "./constants";
import { revalidateMegaschaakAfterTeamChange, sortClassEntries } from "./utils";
import { useToast } from "@/hooks/use-toast";

export function useMegaschaakPage() {
  const { toast } = useToast();
  const { isAuthed } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [teamName, setTeamName] = useState("Nieuw Team");
  const [selectedPlayers, setSelectedPlayers] = useState<MegaschaakPlayer[]>(
    [],
  );
  const [reservePlayer, setReservePlayer] = useState<MegaschaakPlayer | null>(
    null,
  );
  const [activeView, setActiveView] = useState<
    "team" | "standings" | "crosstable" | "popular" | "value"
  >("team");
  const [currentEditingTeam, setCurrentEditingTeam] =
    useState<MegaschaakTeam | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [selectedArchiveId, setSelectedArchiveId] = useState<number | null>(
    null,
  );

  // Fetch active megaschaak tournament
  const { data: activeTournament, isLoading: tournamentLoading } =
    useSWR<Toernooi>(
      "megaschaak/active-tournament",
      async () => {
        const response = await axios.get("/megaschaak/active-tournament");
        return response.data;
      },
      DEFAULT_SWR_OPTIONS,
    );

  const { data: archiveList = [] } = useSWR<MegaschaakArchiveEntry[]>(
    "megaschaak/archive",
    async () => {
      const response = await axios.get("/megaschaak/archive");
      return response.data.items ?? [];
    },
    DEFAULT_SWR_OPTIONS,
  );

  const displayTournament = React.useMemo((): Toernooi | null => {
    if (!activeTournament) return null;
    if (selectedArchiveId === null) return activeTournament;
    const archived = archiveList.find(
      (item) => item.tournament_id === selectedArchiveId,
    );
    if (!archived) return activeTournament;
    return {
      ...activeTournament,
      tournament_id: archived.tournament_id,
      naam: archived.naam,
      finished: archived.finished,
      megaschaak_deadline: archived.megaschaak_deadline,
    };
  }, [activeTournament, selectedArchiveId, archiveList]);

  const isViewingArchive =
    selectedArchiveId !== null &&
    archiveList.find((item) => item.tournament_id === selectedArchiveId)
      ?.is_current !== true;

  // Registration closed after deadline, when finished, or when viewing archive
  const isRegistrationClosed =
    isViewingArchive ||
    displayTournament?.finished === true ||
    (displayTournament?.megaschaak_deadline
      ? isPast(new Date(displayTournament.megaschaak_deadline))
      : false);

  // Reset to 'team' view if deadline hasn't passed and user tries to access other views
  React.useEffect(() => {
    if (!isRegistrationClosed && activeView !== "team") {
      setActiveView("team");
    }
  }, [isRegistrationClosed, activeView]);

  // Fetch available players (all participants from all classes of the active tournament)
  const {
    data: availablePlayers = [],
    isLoading: playersLoading,
    mutate: mutatePlayers,
  } = useSWR<MegaschaakPlayer[]>(
    displayTournament && !isViewingArchive && !isRegistrationClosed
      ? "megaschaak/players"
      : null,
    async () => {
      const response = await axios.get("/megaschaak/players");
      return response.data.items;
    },
    DEFAULT_SWR_OPTIONS,
  );

  // Listen for config updates and refresh players
  React.useEffect(() => {
    const handleConfigUpdate = () => {
      mutatePlayers(undefined, { revalidate: true });
    };

    window.addEventListener("megaschaak-config-updated", handleConfigUpdate);
    return () => {
      window.removeEventListener(
        "megaschaak-config-updated",
        handleConfigUpdate,
      );
    };
  }, [mutatePlayers]);

  // Fetch user's teams for this tournament (only if authenticated)
  const { data: myTeams = [], mutate: mutateTeams } = useSWR<MegaschaakTeam[]>(
    displayTournament && isAuthed
      ? `megaschaak/tournament/${displayTournament.tournament_id}/my-teams`
      : null,
    async () => {
      if (!displayTournament) return [];
      try {
        const response = await axios.get(
          `/megaschaak/tournament/${displayTournament.tournament_id}/my-teams`,
        );
        return response.data.items;
      } catch (error) {
        // If not authenticated, return empty array
        return [];
      }
    },
    DEFAULT_SWR_OPTIONS,
  );

  // After close: show standings when user has no teams (stand/crosstable remain visible)
  React.useEffect(() => {
    if (
      isRegistrationClosed &&
      !tournamentLoading &&
      displayTournament &&
      myTeams.length === 0 &&
      activeView === "team"
    ) {
      setActiveView("standings");
    }
  }, [
    isRegistrationClosed,
    tournamentLoading,
    displayTournament,
    myTeams.length,
    activeView,
  ]);

  const needsStandings =
    displayTournament &&
    (activeView === "standings" || activeView === "team");

  const {
    data: standings = [],
    isLoading: standingsLoading,
    mutate: mutateStandings,
  } = useSWR<any[]>(
    needsStandings
      ? `megaschaak/tournament/${displayTournament!.tournament_id}/standings`
      : null,
    async () => {
      if (!displayTournament) return [];
      const response = await axios.get(
        `/megaschaak/tournament/${displayTournament.tournament_id}/standings`,
      );
      return response.data.items;
    },
    DEFAULT_SWR_OPTIONS,
  );

  // Fetch cross-table data (only if deadline has passed)
  const {
    data: crossTableData,
    isLoading: crossTableLoading,
    mutate: mutateCrossTable,
  } = useSWR<any>(
    displayTournament &&
      isRegistrationClosed &&
      activeView === "crosstable"
      ? `megaschaak/tournament/${displayTournament.tournament_id}/crosstable`
      : null,
    async () => {
      if (!displayTournament) return null;
      const response = await axios.get(
        `/megaschaak/tournament/${displayTournament.tournament_id}/crosstable`,
      );
      return response.data;
    },
    DEFAULT_SWR_OPTIONS,
  );

  // Fetch popular players (only if deadline has passed)
  const {
    data: popularPlayersData,
    isLoading: popularPlayersLoading,
    mutate: mutatePopularPlayers,
  } = useSWR<any>(
    displayTournament &&
      isRegistrationClosed &&
      activeView === "popular"
      ? `megaschaak/tournament/${displayTournament.tournament_id}/popular-players`
      : null,
    async () => {
      if (!displayTournament) return null;
      const response = await axios.get(
        `/megaschaak/tournament/${displayTournament.tournament_id}/popular-players`,
      );
      return response.data;
    },
    DEFAULT_SWR_OPTIONS,
  );

  // Fetch value players (only if deadline has passed)
  const {
    data: valuePlayersData,
    isLoading: valuePlayersLoading,
    mutate: mutateValuePlayers,
  } = useSWR<any>(
    displayTournament &&
      isRegistrationClosed &&
      activeView === "value"
      ? `megaschaak/tournament/${displayTournament.tournament_id}/value-players`
      : null,
    async () => {
      if (!displayTournament) return null;
      const response = await axios.get(
        `/megaschaak/tournament/${displayTournament.tournament_id}/value-players`,
      );
      return response.data;
    },
    DEFAULT_SWR_OPTIONS,
  );

  // Auto-select first team or create mode
  React.useEffect(() => {
    if (myTeams.length > 0 && !currentEditingTeam && !isCreatingNew) {
      setCurrentEditingTeam(myTeams[0]);
    }
  }, [myTeams, currentEditingTeam, isCreatingNew]);

  // Load team into editor when selecting a team
  React.useEffect(() => {
    if (currentEditingTeam && currentEditingTeam.team_id) {
      setTeamName(currentEditingTeam.team_name || "Mijn Team");
      const players = currentEditingTeam.players.map((tp) => ({
        user_id: tp.player.user_id,
        voornaam: tp.player.voornaam,
        achternaam: tp.player.achternaam,
        schaakrating_elo: tp.player.schaakrating_elo,
        is_youth: tp.player.is_youth,
        avatar_url: tp.player.avatar_url,
        cost: tp.cost,
      }));
      setSelectedPlayers(players);

      // Load reserve player if exists
      if (currentEditingTeam.reserve_player) {
        const reservePlayerData = availablePlayers.find(
          (p) => p.user_id === currentEditingTeam.reserve_player?.user_id,
        );
        if (reservePlayerData) {
          setReservePlayer(reservePlayerData);
        } else if (currentEditingTeam.reserve_player) {
          // Fallback if not in available players list
          setReservePlayer({
            ...currentEditingTeam.reserve_player,
            cost: currentEditingTeam.reserve_cost || 0,
            class_name: "",
          });
        }
      } else {
        setReservePlayer(null);
      }
    } else if (isCreatingNew) {
      setTeamName("Nieuw Team");
      setSelectedPlayers([]);
      setReservePlayer(null);
    }
  }, [currentEditingTeam, isCreatingNew, availablePlayers]);

  // Calculate total cost
  const totalCost = selectedPlayers.reduce(
    (sum, player) => sum + player.cost,
    0,
  );
  const remainingBudget = MAX_BUDGET - totalCost;

  // Filter and group players by class
  const filteredPlayers = availablePlayers.filter((player) => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${player.voornaam} ${player.achternaam}`.toLowerCase();
    return fullName.includes(searchLower);
  });

  // Group players by class
  const playersByClass = React.useMemo(() => {
    const groups = new Map<string, MegaschaakPlayer[]>();

    filteredPlayers.forEach((player) => {
      const className = player.class_name || "Hoofdtoernooi";
      if (!groups.has(className)) {
        groups.set(className, []);
      }
      groups.get(className)!.push(player);
    });

    return sortClassEntries(Array.from(groups.entries()));
  }, [filteredPlayers]);

  const isPlayerSelected = (playerId: number) => {
    return selectedPlayers.some((p) => p.user_id === playerId);
  };

  const canAddPlayer = (player: MegaschaakPlayer) => {
    if (selectedPlayers.length >= MAX_PLAYERS) return false;
    if (isPlayerSelected(player.user_id)) return false;
    if (totalCost + player.cost > MAX_BUDGET) return false;
    return true;
  };

  const addPlayer = (player: MegaschaakPlayer) => {
    if (!canAddPlayer(player)) return;
    setSelectedPlayers([...selectedPlayers, player]);
  };

  const removePlayer = (playerId: number) => {
    setSelectedPlayers(selectedPlayers.filter((p) => p.user_id !== playerId));
  };

  const setAsReserve = (player: MegaschaakPlayer) => {
    if (player.cost > 100) {
      toast({
        title: "Fout",
        description: "Reservespeler mag maximaal 100 punten kosten",
        variant: "destructive",
      });
      return;
    }
    setReservePlayer(player);
    toast({
      title: "Reservespeler geselecteerd",
      description: `${player.voornaam} ${player.achternaam} is nu je reservespeler`,
    });
  };

  const handleSaveTeam = async () => {
    if (!displayTournament || isViewingArchive) return;

    if (selectedPlayers.length < MIN_PLAYERS || selectedPlayers.length > MAX_PLAYERS) {
      toast({
        title: "Fout",
        description: `Je moet ${MIN_PLAYERS} of ${MAX_PLAYERS} spelers selecteren (momenteel: ${selectedPlayers.length})`,
        variant: "destructive",
      });
      return;
    }

    if (!teamName.trim()) {
      toast({
        title: "Fout",
        description: "Geef je team een naam.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (currentEditingTeam && !isCreatingNew) {
        // Update existing team
        await axios.put(`/megaschaak/team/${currentEditingTeam.team_id}`, {
          playerIds: selectedPlayers.map((p) => p.user_id),
          teamName: teamName,
          reservePlayerId: reservePlayer?.user_id || null,
        });

        toast({
          title: "Succes!",
          description: "Team bijgewerkt!",
        });
      } else {
        // Create new team
        await axios.post(
          `/megaschaak/tournament/${displayTournament.tournament_id}/team`,
          {
            playerIds: selectedPlayers.map((p) => p.user_id),
            teamName: teamName,
            reservePlayerId: reservePlayer?.user_id || null,
          },
        );

        toast({
          title: "Succes!",
          description: "Nieuw team aangemaakt!",
        });

        setIsCreatingNew(false);
      }

      await Promise.all([
        mutateTeams(undefined, { revalidate: true }),
        mutateStandings(undefined, { revalidate: true }),
        mutateCrossTable(undefined, { revalidate: true }),
        mutatePopularPlayers(undefined, { revalidate: true }),
        mutateValuePlayers(undefined, { revalidate: true }),
        revalidateMegaschaakAfterTeamChange(),
      ]);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "Kon team niet opslaan";
      toast({
        title: "Fout",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleNewTeam = () => {
    setIsCreatingNew(true);
    setCurrentEditingTeam(null);
    setTeamName("Nieuw Team");
    setSelectedPlayers([]);
    setReservePlayer(null);
  };

  const handleSelectTeam = (team: MegaschaakTeam) => {
    setIsCreatingNew(false);
    setCurrentEditingTeam(team);
    setTeamName(team.team_name);

    // Map players and add class_name from availablePlayers
    const mappedPlayers = team.players.map((p) => {
      const playerData = availablePlayers.find(
        (ap) => ap.user_id === p.player.user_id,
      );
      return {
        ...p.player,
        cost: p.cost,
        class_name: playerData?.class_name || "",
      };
    });
    setSelectedPlayers(mappedPlayers);

    // Load reserve player if exists
    if (team.reserve_player) {
      const reservePlayerData = availablePlayers.find(
        (p) => p.user_id === team.reserve_player?.user_id,
      );
      if (reservePlayerData) {
        setReservePlayer(reservePlayerData);
      } else if (team.reserve_player) {
        // Fallback if not in available players list
        setReservePlayer({
          ...team.reserve_player,
          cost: team.reserve_cost || 0,
          class_name: "",
        });
      }
    } else {
      setReservePlayer(null);
    }
  };

  // Update selectedPlayers class_name when availablePlayers loads
  React.useEffect(() => {
    if (availablePlayers.length > 0 && selectedPlayers.length > 0) {
      setSelectedPlayers((prevPlayers) =>
        prevPlayers.map((p) => {
          const playerData = availablePlayers.find(
            (ap) => ap.user_id === p.user_id,
          );
          if (playerData && playerData.class_name && !p.class_name) {
            return {
              ...p,
              class_name: playerData.class_name,
            };
          }
          return p;
        }),
      );
    }
  }, [availablePlayers]);

  const handleDeleteTeam = async (teamId: number, teamName: string) => {
    if (!confirm(`Weet je zeker dat je "${teamName}" wilt verwijderen?`))
      return;

    try {
      await axios.delete(`/megaschaak/team/${teamId}`);

      toast({
        title: "Succes!",
        description: "Team verwijderd!",
      });

      setCurrentEditingTeam(null);
      setIsCreatingNew(false);
      await Promise.all([
        mutateTeams(undefined, { revalidate: true }),
        mutateStandings(undefined, { revalidate: true }),
        mutateCrossTable(undefined, { revalidate: true }),
        mutatePopularPlayers(undefined, { revalidate: true }),
        mutateValuePlayers(undefined, { revalidate: true }),
        revalidateMegaschaakAfterTeamChange(),
      ]);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "Kon team niet verwijderen";
      toast({
        title: "Fout",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const needsPlayerList =
    displayTournament && !isViewingArchive && !isRegistrationClosed;

  return {
    tournamentLoading,
    displayTournament,
    archiveList,
    selectedArchiveId,
    setSelectedArchiveId,
    isViewingArchive,
    isRegistrationClosed,
    activeView,
    setActiveView,
    myTeams,
    standings,
    standingsLoading,
    crossTableData,
    crossTableLoading,
    popularPlayersData,
    popularPlayersLoading,
    valuePlayersData,
    valuePlayersLoading,
    playersLoading,
    needsPlayerList,
    searchTerm,
    setSearchTerm,
    teamName,
    setTeamName,
    selectedPlayers,
    setSelectedPlayers,
    reservePlayer,
    setReservePlayer,
    isCreatingNew,
    setIsCreatingNew,
    currentEditingTeam,
    setCurrentEditingTeam,
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
  };
}
