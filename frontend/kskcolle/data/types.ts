export enum TournamentType {
  SWISS = "SWISS",
  ROUND_ROBIN = "ROUND_ROBIN",
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
}
export interface CalendarEvent {
  event_id: number
  title: string
  description: string
  date: string
  type: string
}

export interface CalendarEventInput {
  id?: number
  title: string
  description: string
  date: Date
  type: string
}

export type Game = {
  game_id: number;
  round_id: number;
  speler1_id: number;
  speler2_id: number;
  winnaar_id: number | null;
  result: string | null;
  uitgestelde_datum ?: Date | null
  speler1: User;
  speler2: User;
  winnaar: User | null;
};

export type Round = {
  round_id: number;
  tournament_id: number;
  ronde_nummer: number;
  ronde_datum: Date;
  games: Game[];
};

export type MakeupDay = {
  id: number
  round_after: number
  date: string
  label?: string
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
  speler2_id: number;
  speler1_naam: string;
  speler2_naam: string;
  winnaar_id: number | null;
  result?: string;
  uitgestelde_datum?: string;
  round: {
    round_id: number;
    tournament_id: number;
    ronde_nummer: number;
    ronde_datum: string;
    tournament: {
      tournament_id: number;
      naam: string;
      rondes: number;
    }
  }
}