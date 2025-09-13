export enum TournamentType {
  SWISS = "SWISS",
  ROUND_ROBIN = "ROUND_ROBIN",
}
export interface User {
  user_id: number;
  voornaam: string;
  achternaam: string;
  geboortedatum?: Date | null;
  email: string | null;
  tel_nummer: string;
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
  avatar_url?: string;
  roles?: string[];
  // Lidgeld status
  lidgeld_betaald: boolean;
  lidgeld_periode_start?: Date | null;
  lidgeld_periode_eind?: Date | null;
  bondslidgeld_betaald: boolean;
  bondslidgeld_periode_start?: Date | null;
  bondslidgeld_periode_eind?: Date | null;
  jeugdlidgeld_betaald: boolean;
  jeugdlidgeld_periode_start?: Date | null;
  jeugdlidgeld_periode_eind?: Date | null;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetResponse {
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ValidateTokenResponse {
  valid: boolean;
}

export interface GeneratePasswordResponse {
  message: string;
}

export interface CreateUserResponse {
  userId: number;
  message: string;
}

export interface CreateUserRequest {
  voornaam: string;
  achternaam: string;
  email?: string;
  geboortedatum?: string;
  tel_nummer: string;
  vast_nummer?: string;
  schaakrating_elo?: number;
  is_admin?: boolean;
  is_youth?: boolean;
  fide_id?: number;
  lid_sinds?: string;
  adres_straat?: string;
  adres_nummer?: string;
  adres_bus?: string;
  adres_postcode?: string;
  adres_gemeente?: string;
  adres_land?: string;
  roles?: string[];
}

export interface CalendarEvent {
  event_id: number
  title: string
  description: string
  date: string
  startuur: string
  type: string
  tournament_id?: number
  is_youth?: boolean
  category?: string | string[] // JSON array van stappen of string
  instructors?: string // JSON array van lesgever namen
  begeleider?: string // JSON array van begeleider namen
}

export interface CalendarEventInput {
  id?: number
  title: string
  description: string
  date: Date
  startuur: string
  type: string
  tournament_id?: number
  is_youth?: boolean
  category?: string | string[] // JSON array van stappen of string
  instructors?: string // JSON array van lesgever namen
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
  type: 'REGULAR' | 'MAKEUP';
  label?: string;
  calendar_event_id?: number;
  is_sevilla_imported: boolean;
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