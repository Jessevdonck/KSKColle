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

export interface Game {
  game_id: number;
  round_id: number;
  speler1_id: number;
  speler2_id: number;
  winnaar_id: number | null;
  result?: string;
  uitgestelde_datum?: Date;
  round: Round;
  speler1: User;
  speler2: User;
}

export interface Round {
  round_id: number;
  tournament_id: number;
  ronde_nummer: number;
  ronde_datum: Date;
  tournament: Tournament;
}

export interface Tournament {
  tournament_id: number;
  naam: string;
  rondes: number;
}

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