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
  is_youth?: boolean;
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


export interface MakeupDay {
  id: number
  tournament_id: number
  round_after: number
  date: Date      // ISO string
  startuur: string
  label?: string | null
  calendar_event_id?: number | null
}

import { RoundType } from '@prisma/client'

export { RoundType }