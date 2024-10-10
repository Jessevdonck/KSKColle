import type { Spellen } from "./types";
import { SPELLEN } from "./data/mock_data";

// Haal alle spellen op
export const getAllSpellen = () => {
  return SPELLEN;
};
  
// Haal spellen op van een bepaalde paring
export const getSpellenByPairingId = (pairingId: string) => {
  return SPELLEN.filter((spel) => spel.pairing_id === pairingId);
};
  
// Haal spellen op van een toernooi
export const getSpellenByTournamentId = (tournamentId: string) => {
  return SPELLEN.filter((spel) => spel.tournament_id === tournamentId);
};
  
// Voeg een nieuw spel toe
export const addSpel = (newSpel: Spellen) => {
  SPELLEN.push(newSpel);
};
  
// Update een spel
export const updateSpel = (updatedSpel: Spellen) => {
  const index = SPELLEN.findIndex((spel) => spel.game_id === updatedSpel.game_id);
  if (index !== -1) {
    SPELLEN[index] = updatedSpel; 
    return updatedSpel; 
  }
  return null; 
};