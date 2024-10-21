import type { ListResponse } from "./common";

export type Ronde = {
  round_id: number;
  tournament_id: number;
  ronde_nummer: number;
  ronde_datum: Date;
};

export type RondeCreateInput = {
  tournament_id: number;
  ronde_nummer: number;
  ronde_datum: Date;
};

export interface IdRondeParams {
  tournament_id: number;
  ronde_id: number;
}

export interface RondeUpdateInput extends RondeCreateInput {}

export interface CreateRoundRequest extends RondeCreateInput {}
export interface UpdateRoundRequest extends RondeUpdateInput {}

export interface GetAllRoundsResponse extends ListResponse<Ronde> {}
export interface GetRoundByIdResponse extends Ronde {}
export interface CreateRoundResponse extends GetRoundByIdResponse {}
export interface UpdateRoundResponse extends GetRoundByIdResponse {}