import type { ListResponse } from "./common";

export type Spel = {
  game_id: number;
  round_id: number;
  speler1_id: number;
  speler2_id: number;
  winnaar_id?: number | null;
  resultaat?: string | null;
  uitgestelde_datum?: Date | null;
};

export type SpelCreateInput = {
  round_id: number;
  speler1_id: number;
  speler2_id: number;
  winnaar_id?: number | null;
  resultaat?: string | null;
  uitgestelde_datum?: Date | null;
};

export type GameWithRoundAndTournament = {
  game_id: number;
  round_id: number;
  speler1_id: number;
  speler2_id: number;
  speler1_naam: string;
  speler2_naam: string;
  winnaar_id?: number | null;
  result?: string | null;
  uitgestelde_datum?: string | null | undefined;
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
};

export interface SpelUpdateInput extends SpelCreateInput {}

export interface CreateSpelRequest extends SpelCreateInput {}
export interface UpdateSpelRequest extends SpelUpdateInput {}

export interface GetAllSpellenResponse extends ListResponse<Spel> {}
export interface GetSpelByIdResponse extends Spel {}
export interface CreateSpelResponse extends GetSpelByIdResponse {}
export interface UpdateSpelResponse extends GetSpelByIdResponse {}