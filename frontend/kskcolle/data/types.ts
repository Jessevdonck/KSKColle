export enum TournamentType {
  SWISS = "SWISS",
  ROUND_ROBIN = "ROUND_ROBIN",
}
export interface User {
  user_id: number;
  voornaam: string;
  achternaam: string;
  geboortedatum: Date;
  email: string;
  schaakrating_elo: number;
  schaakrating_difference?: number;
  schaakrating_max?: number;
  is_admin?: boolean;
  is_youth?: boolean;
  fide_id?: number;
  nationaal_id?: number;
  lid_sinds: Date;
  adres_straat: string;      
  adres_nummer: string;   
  adres_bus: string;          
  adres_postcode: string;      
  adres_gemeente: string;       
  adres_land: string;   
  vast_nummer?: string;
}
export interface CalendarEvent {
  event_id: number
  title: string
  description: string
  date: string
  startuur: string
  type: string
  tournament_id?: number
}

export interface CalendarEventInput {
  id?: number
  title: string
  description: string
  date: Date
  startuur: string
  type: string
  tournament_id?: number
}

export interface Game {
  game_id: number;
  round_id: number;
  speler1_id: number;
  speler2_id: number | null;
  winnaar_id: number | null;
  result: string | null;
  uitgestelde_datum: Date | null;
  speler1: User;
  speler2: User | null;
  round: Round;
}

export type Round = {
  round_id: number;
  tournament_id: number;
  ronde_nummer: number;
  ronde_datum: Date;
  startuur: string;
  games: Game[];
};

export type MakeupDay = {
  id: number
  round_after: number
  date: string
  startuur: string
  label?: string
  calendar_event_id?: number
}


export type Toernooi = {
  tournament_id: number;
  naam: string;
  rondes: number;
  type: TournamentType;
  participations: Participation[];
  finished: boolean;
  rating_enabled: boolean;
  rounds: Round[];
};

export type Participation = {
  user_id: number;
  tournament_id: number;
  user: User;
};

export interface GameWithRoundAndTournament {
  game_id: number;
  round_id: number;
  speler1_id: number;
  speler2_id: number | null;
  winnaar_id: number | null;
  result: string | null;
  uitgestelde_datum: Date | null;
  speler1_naam: string;
  speler2_naam: string | null;
  round: {
    round_id: number;
    tournament_id: number;
    ronde_nummer: number;
    ronde_datum: Date;
    startuur: string;
    tournament: {
      tournament_id: number;
      naam: string;
      rondes: number;
    };
  };
}