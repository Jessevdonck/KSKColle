import { prisma } from "../data";
import handleDBError from "../handleDBError";

import { getActiveMegaschaakTournament } from "./competition";
import { calculatePlayerCost } from "./config";
import { isExcludedFromMegaschaak } from "./exclusions";

export const getAvailablePlayers = async () => {
  try {
    // First, find the active megaschaak tournament
    const activeTournament = await getActiveMegaschaakTournament();

    if (!activeTournament) {
      // No active megaschaak tournament, return empty array
      return [];
    }

    // Find all tournaments with the same name (different classes)
    const allClassesTournaments = await prisma.tournament.findMany({
      where: {
        naam: activeTournament.naam,
      },
      include: {
        participations: {
          include: {
            user: {
              select: {
                user_id: true,
                voornaam: true,
                achternaam: true,
                schaakrating_elo: true,
                is_youth: true,
                avatar_url: true,
              },
            },
          },
        },
      },
      orderBy: {
        class_name: "asc",
      },
    });

    // Collect participants with their class information
    const participantsMap = new Map();

    for (const tournament of allClassesTournaments) {
      for (const participation of tournament.participations) {
        if (!participantsMap.has(participation.user.user_id)) {
          participantsMap.set(participation.user.user_id, {
            ...participation.user,
            class_name: tournament.class_name || "Hoofdtoernooi",
          });
        }
      }
    }

    // Convert to array and add costs
    const playersWithCosts = [];
    for (const user of participantsMap.values()) {
      if (
        isExcludedFromMegaschaak(user.voornaam || "", user.achternaam || "")
      ) {
        continue; // Skip: buiten competitie / uitgesloten van megaschaak
      }

      const cost = await calculatePlayerCost(
        user.user_id,
        user.class_name,
        allClassesTournaments.map((t) => t.tournament_id),
      );
      playersWithCosts.push({
        ...user,
        cost,
      });
    }

    const players = playersWithCosts.sort((a, b) => {
      // First sort by class_name
      if (a.class_name !== b.class_name) {
        return a.class_name.localeCompare(b.class_name);
      }
      // Then by rating (descending)
      return b.schaakrating_elo - a.schaakrating_elo;
    });

    return players;
  } catch (error) {
    throw handleDBError(error);
  }
};
