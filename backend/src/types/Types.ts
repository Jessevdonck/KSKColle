export enum TournamentType {
  SWISS = "SWISS",
  ROUND_ROBIN = "ROUND_ROBIN",
}

export interface Player {
  user_id: number;
  voornaam: string;
  achternaam: string;
  email: string;
  schaakrating_elo: number;
}

export interface Participation {
  user_id: number;
  tournament_id: number;
  score: number;
  buchholz: number;
  sonnebornBerger: number;
  opponents: number[];
  color_history: ('W' | 'B' | 'N')[];
  bye_round: number | null;
}

export interface Pairing {
  speler1_id: number;
  speler2_id: number | null;
  color1: 'W' | 'B' | 'N';
  color2: 'W' | 'B' | 'N';
}

export interface IPairingStrategy {
  generatePairings(
    players: Player[],
    roundNumber: number,
    previousRounds: Pairing[][]
  ): { pairings: Pairing[]; byePlayer?: Player };
}

export interface MakeupDay {
  id: number
  tournament_id: number
  round_after: number
  date: Date      // ISO string
  label?: string | null
}