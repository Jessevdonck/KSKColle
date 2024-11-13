import { createSwissPairings, savePairings } from './swiss-pairings';

export async function createAndSaveSwissPairings(tournament_id: number, round_number: number): Promise<void> {
  const pairings = await createSwissPairings(tournament_id, round_number);
  await savePairings(tournament_id, round_number, pairings);
}