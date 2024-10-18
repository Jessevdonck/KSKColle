export interface Player {
  user_id: number
  voornaam: string
  achternaam: string
  geboortedatum: Date
  schaakrating_elo: number
  schaakrating_difference?: number | null
  schaakrating_max?: number | null
  is_admin?: boolean
  fide_id?: number | null
  nationaal_id?: number | null
  lid_sinds: Date
}

export interface User {
  user_id: number; 
  voornaam: string; 
  achternaam: string; 
  geboortedatum: Date; 
  schaakrating_elo: number; 
  schaakrating_difference?: number; 
  schaakrating_max?: number;
  is_admin?: boolean; 
  fide_id?: number; 
  nationaal_id?: number; 
  lid_sinds: Date; 
  
  participations: Participation[]; 
  speler1Games: Game[]; 
  speler2Games: Game[]; 
  gewonnenGames: Game[];
}

export interface Round {
  round_id: number; 
  tournament_id: string; 
  ronde_nummer: number; 
  ronde_datum: Date; 

  tournament: Tournament; 
  games: Game[]; 
}

export interface Tournament {
  tournament_id: string; 
  naam: string; 
  rondes: number; 
  
  participations: Participation[]; 
  rounds: Round[];
}


export interface Game {
  game_id: string; 
  round_id: number;
  speler1_id: number; 
  speler2_id: number; 
  winnaar_id?: number; 
  result?: string;
  uitgestelde_datum?: Date; 

  round: Round; 
  speler1: User; 
  speler2: User; 
  winnaar?: User; 
}

export interface Participation {
  user_id: number; 
  tournament_id: string; 
}

export interface GameWithRoundAndTournament extends Game {
  round: Round & { tournament: Tournament };
}

  