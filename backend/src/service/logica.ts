import { TOERNOOIEN, RONDES, PARINGEN, SPELLEN, DEELNAMES, SPELERS } from './data/mock_data';
import type {Toernooi, Ronde, Paring, Spellen, Deelnames, Speler} from "./types";
/*-------------------------------------------SPELERS-------------------------------------------*/

export const getAllSpelersRatingGrootNaarKlein = () => {
  return SPELERS.sort((a,b) => b.elio_07_24 - a.elio_07_24);
};

export const getAllSpelersRatingKleinNaarGroot = () => {
  return SPELERS.sort((a,b) => a.elio_07_24 - b.elio_07_24);
};

export const getAllSpelersAlfabetisch = () => {
  return SPELERS.sort((a,b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
};

export const getAllSpelersAlfabetischReverse = () => {
  return SPELERS.sort((a, b) => a.name > b.name ? -1 : a.name < b.name ? 1 : 0);
};

export const getAllSpelersByMaxRating = () => {
  return SPELERS.sort((a,b) => b.max - a.max);
};

export const getAllSpelersByMaxRatingReverse = () => {
  return SPELERS.sort((a,b) => a.max - b.max);
};

export const getAllSpelersByRatingDifference = () => {
  return SPELERS.sort((a,b) => b.difference - a.difference);
};

export const getAllSpelersByRatingDifferenceReverse = () => {
  return SPELERS.sort((a,b) => a.difference - b.difference);
};

export const getSpelerByID = (id: number) => {
  return SPELERS.find((speler) => speler.user_id === id) || null;
};

export const addSpeler = (newSpeler: Speler) => {
  // 👇 1: Controleer of de nieuwe speler gegevens heeft
  if (!newSpeler.name) {
    throw new Error('Name is required to add a speler.');
  }
  
  const maxId = Math.max(...SPELERS.map((speler) => speler.user_id), 0); 

  const spelerToAdd: Speler = {
    user_id: maxId + 1, 
    name: newSpeler.name,
    elio_01_24: newSpeler.elio_01_24 ?? 0, 
    elio_07_24: newSpeler.elio_07_24 ?? 0, 
    difference: newSpeler.difference ?? 0, 
    max: newSpeler.max ?? 0, 
  };
  
  SPELERS.push(spelerToAdd);
  
  return spelerToAdd;
};

export const updateSpeler = (id: number, updatedSpeler: any) => {
  const index = SPELERS.findIndex((speler) => speler.user_id === id);

  const updated = {
    ...SPELERS[index],  
    ...updatedSpeler,   
  };

  SPELERS[index] = updated; 

  return updated; 
};

export const removeSpeler = (id: number) => {
  const index = SPELERS.findIndex((speler) => speler.user_id === id);
  if (index !== -1) {
    SPELERS.splice(index, 1);
  } else {
    throw new Error('Speler niet gevonden');
  }
};

/*-------------------------------------------TOERNOOIEN-------------------------------------------*/

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

/*-------------------------------------------RONDES-------------------------------------------*/
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

/*-------------------------------------------PARINGEN-------------------------------------------*/

export const getAllParingen = () => {
  return PARINGEN;
};

export const getAllParingenByRound = (roundId: string) => {
  return PARINGEN.filter((paring) => paring.round_id === roundId);
};

export const addParing = (newPairing: Paring) => {
  PARINGEN.push(newPairing);
};

/*-------------------------------------------SPELLEN-------------------------------------------*/
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
/*-------------------------------------------DEELNAMES-------------------------------------------*/

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