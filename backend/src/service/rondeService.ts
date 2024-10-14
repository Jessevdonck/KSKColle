import type { Ronde } from "./data/types";
import { RONDES } from "./data/mock_data";

export const getAllRondes = () => {
  return RONDES;
};
  
export const getAllRondesByTournament = (tournamentId: string) => {
  return RONDES.filter((ronde) => ronde.tournament_id === tournamentId); 
};
  
export const getRondeByTournament = (tournamentId: string) => {
  return RONDES.filter((ronde) => ronde.tournament_id === tournamentId);
};
  
export const getAllRondeIdByTournament = (tournamentId: string) => {
  getAllRondesByTournament(tournamentId).map((ronde) => ronde.round_id);
};
  
export const addRonde = (newRonde: Ronde) => {
  RONDES.push(newRonde);
};