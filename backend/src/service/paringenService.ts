import type { Paring } from "./types";
import { PARINGEN } from "./data/mock_data";

export const getAllParingen = () => {
  return PARINGEN;
};
  
export const getAllParingenByRound = (roundId: string) => {
  return PARINGEN.filter((paring) => paring.round_id === roundId);
};
  
export const addParing = (newPairing: Paring) => {
  PARINGEN.push(newPairing);
};