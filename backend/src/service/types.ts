export type Toernooi = {
  tournament_id: string;
  naam: string;
  rondes: number;
};
  
export type Ronde = {
  round_id: string;
  tournament_id: string;
  ronde_nummer: number;
};
  
export type Paring = {
  pairing_id: string;
  round_id: string;
  player1_id: string;
  player2_id: string;
};
  
export type Speler = {
  user_id: number;
  name: string;
  elio_01_24: number;
  elio_07_24: number;
  difference: number;
  max: number;
};
  
export type Spellen = {
  game_id: string,
  pairing_id: string,
  tournament_id: string,
  winner_id: string,
  date: string,
  result: string,
};
  
export type Deelnames = {
  user_id: string,
  tournament_id: string,
};