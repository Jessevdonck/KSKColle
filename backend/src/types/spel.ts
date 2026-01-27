import type { ListResponse } from "./common";

export type GameResult = "1-0" | "0-1" | "1/2-1/2" | "1-0FF" | "0-1FF" | "0-0" | "not_played";

export type Spel = {
  game_id: number;
  round_id: number;
  speler1_id: number ;
  speler2_id?: number | null;
  winnaar_id?: number | null;
  result?: GameResult | null;
  uitgestelde_datum?: Date | null;
};

export type SpelWithTournament = {
  game_id: number;
  round_id: number;
  speler1_id: number ;
  speler2_id?: number | null;
  winnaar_id?: number | null;
  result?: GameResult | null;
  uitgestelde_datum?: Date | null;

  round: {
    round_id: number;
    tournament_id: number;
    ronde_nummer: number;
    ronde_datum: Date;
    tournament: {
      tournament_id: number;
      naam: string;
      rondes: number;
    };
  };
}

export type SpelCreateInput = {
  round_id: number;
  speler1_id: number;
  speler2_id?: number | null;
  winnaar_id?: number | null;
  result?: GameResult | null;
  uitgestelde_datum?: Date | null;
};

export interface GameWithRoundAndTournament {
  game_id: number;
  round_id: number;
  speler1_id: number;
  speler2_id: number | null;
  winnaar_id: number | null;
  result: GameResult | null;
  uitgestelde_datum: Date | null;
  speler1_naam: string;
  speler2_naam: string | null;
  speler1_rating?: number | null;
  speler2_rating?: number | null;
  /** Ratingwinst/verlies in dit toernooi (sevilla_rating_change van de speler). */
  rating_change_in_tournament?: number | null;
  round: {
    round_id: number;
    tournament_id: number;
    ronde_nummer: number;
    ronde_datum: Date;
    tournament: {
      tournament_id: number;
      naam: string;
      rondes: number;
    };
  };
}

export interface SpelUpdateInput extends SpelCreateInput {}

export interface CreateSpelRequest extends SpelCreateInput {}
export interface UpdateSpelRequest extends SpelUpdateInput {}

export interface GetAllSpellenResponse extends ListResponse<Spel> {}
export interface GetSpelByIdResponse extends SpelWithTournament {}
export interface CreateSpelResponse extends GetSpelByIdResponse {}
export interface UpdateSpelResponse extends GetSpelByIdResponse {}