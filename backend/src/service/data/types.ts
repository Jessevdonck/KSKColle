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
  
interface Speler {
  voornaam: string;
  achternaam: string;
  geboortedatum: Date; 
  schaakrating_elo: number;
  is_admin: boolean;
  fide_id: number;
  nationaal_id: number;
  lid_sinds: Date; 
}
  
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