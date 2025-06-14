import { prisma } from './data'
import type { MakeupDay } from '../types/Types'
import handleDBError from './handleDBError'

export async function getMakeupDaysForTournament(tournament_id: number): Promise<MakeupDay[]> {
  return prisma.makeupDay.findMany({
    where: { tournament_id },
    orderBy: { round_after: 'asc' },
  });
}

export async function addMakeupDay(
  tournament_id: number,
  round_after: number,
  date: Date,
  label?: string
): Promise<MakeupDay> {
  try {
    return await prisma.makeupDay.create({
      data: {
        tournament_id,
        round_after,
        date,
        label: label ?? null,
      },
    })
  } catch (e) {
    throw handleDBError(e)
  }
}

export async function removeMakeupDay(id: number): Promise<void> {
  try {
    await prisma.makeupDay.delete({ where: { id } })
  } catch (e) {
    throw handleDBError(e)
  }
}
