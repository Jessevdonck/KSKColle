import { prisma } from "./data";
import handleDBError from "./handleDBError";

/** Historische ELIO-rating van een speler, chronologisch (oudste periode eerst). */
export async function getEloHistoryForUser(userId: number) {
  try {
    const rows = await prisma.eloHistory.findMany({
      where: { user_id: userId },
      select: {
        period: true,
        rating: true,
      },
      orderBy: { period: "asc" },
    });
    return rows;
  } catch (error) {
    throw handleDBError(error);
  }
}
