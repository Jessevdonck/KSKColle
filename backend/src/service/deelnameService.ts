import type { Deelnames } from "../types/types";
import { DEELNAMES } from "./data/mock_data";

// alle deelnames op te halen
export const getAllDeelnames = (): Deelnames[] => {
  return DEELNAMES;
};
  
// een deelname op te halen op basis van user_id en tournament_id
export const getDeelnamesByUserIdAndTournamentId = (userId: string, tournamentId: string) => {
  return DEELNAMES.find((deelname) => deelname.user_id === userId && deelname.tournament_id === tournamentId) || null;
};
  
// een deelname toe te voegen
export const addDeelname = (newDeelname: Deelnames): Deelnames => {
  DEELNAMES.push(newDeelname);
  return newDeelname;
};
  
// een deelname te verwijderen
export const removeDeelname = (userId: string, tournamentId: string) => {
  const index = DEELNAMES.findIndex((deelname) => 
    deelname.user_id === userId && deelname.tournament_id === tournamentId);
  
  if (index !== -1) {
    DEELNAMES.splice(index, 1);
  }
};
  
// alle deelnames op te halen voor een specifiek toernooi
export const getDeelnamesByTournamentId = (tournamentId: string): Deelnames[] => {
  return DEELNAMES.filter((deelname) => deelname.tournament_id === tournamentId);
};