import type { Speler } from "./types";
import { SPELERS } from "./data/mock_data";

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