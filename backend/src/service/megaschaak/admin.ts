import { prisma } from "../data";
import ServiceError from "../../core/serviceError";
import handleDBError from "../handleDBError";

import { getMegaschaakConfig } from "./config";
import type { MegaschaakConfig } from "./types";

export const toggleMegaschaak = async (
  tournamentId: number,
  enabled: boolean,
) => {
  try {
    const tournament = await prisma.tournament.update({
      where: { tournament_id: tournamentId },
      data: { megaschaak_enabled: enabled },
    });

    return tournament;
  } catch (error) {
    throw handleDBError(error);
  }
};

/**
 * Set the registration deadline for megaschaak
 */
export const setMegaschaakDeadline = async (
  tournamentId: number,
  deadline: Date | null,
) => {
  try {
    const tournament = await prisma.tournament.update({
      where: { tournament_id: tournamentId },
      data: { megaschaak_deadline: deadline },
    });

    return tournament;
  } catch (error) {
    throw handleDBError(error);
  }
};

/**
 * Calculate score for a player in a specific game
 */
export const adminDeleteTeam = async (teamId: number) => {
  try {
    const team = await prisma.megaschaakTeam.findUnique({
      where: { team_id: teamId },
    });

    if (!team) {
      throw ServiceError.notFound("Team niet gevonden");
    }

    await prisma.megaschaakTeam.delete({
      where: { team_id: teamId },
    });
  } catch (error) {
    throw handleDBError(error);
  }
};

/**
 * Get megaschaak configuration for a tournament (admin only)
 */
export const getMegaschaakConfiguration = async (
  tournamentId: number,
): Promise<MegaschaakConfig> => {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { tournament_id: tournamentId },
      select: { megaschaak_config: true },
    });

    if (!tournament) {
      throw ServiceError.notFound("Toernooi niet gevonden");
    }

    return await getMegaschaakConfig([tournamentId]);
  } catch (error) {
    throw handleDBError(error);
  }
};

/**
 * Update megaschaak configuration for a tournament (admin only)
 */
export const updateMegaschaakConfiguration = async (
  tournamentId: number,
  config: Partial<MegaschaakConfig>,
): Promise<MegaschaakConfig> => {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { tournament_id: tournamentId },
    });

    if (!tournament) {
      throw ServiceError.notFound("Toernooi niet gevonden");
    }

    // Get current config and merge with new values
    const currentConfig = await getMegaschaakConfig([tournamentId]);
    const updatedConfig: MegaschaakConfig = {
      classBonusPoints: {
        ...currentConfig.classBonusPoints,
        ...(config.classBonusPoints || {}),
      },
      roundsPerClass: {
        ...currentConfig.roundsPerClass,
        ...(config.roundsPerClass || {}),
      },
      correctieMultiplier:
        config.correctieMultiplier ?? currentConfig.correctieMultiplier,
      correctieSubtract:
        config.correctieSubtract ?? currentConfig.correctieSubtract,
      minCost: config.minCost ?? currentConfig.minCost,
      maxCost: config.maxCost ?? currentConfig.maxCost,
    };

    // Find all tournaments with the same name (all classes should share the same config)
    const allClassesTournaments = await prisma.tournament.findMany({
      where: {
        naam: tournament.naam,
      },
      select: {
        tournament_id: true,
      },
    });

    // Update all tournaments with the same name with the new config
    await prisma.tournament.updateMany({
      where: {
        tournament_id: {
          in: allClassesTournaments.map((t) => t.tournament_id),
        },
      },
      data: {
        megaschaak_config: updatedConfig as any,
      },
    });

    return updatedConfig;
  } catch (error) {
    throw handleDBError(error);
  }
};
