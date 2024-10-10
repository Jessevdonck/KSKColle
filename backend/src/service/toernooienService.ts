import type { Toernooi } from "./types";
import { TOERNOOIEN } from "./data/mock_data";

export const getAllTournament = () => {
  return TOERNOOIEN;
};
  
export const addTournament = (newTournament: Toernooi) => {
  TOERNOOIEN.push(newTournament);
};
  
export const removeTournament = (tournamentId: string) => {
  const index = TOERNOOIEN.findIndex((toernooi) => toernooi.tournament_id === tournamentId);
  if (index !== -1) {
    TOERNOOIEN.splice(index, 1); 
  } 
};
  
