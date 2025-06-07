import type { ListResponse } from "./common";
import { TournamentType } from "@prisma/client";

export type Tournament = {
  tournament_id: number;
  naam: string;
  type: TournamentType;  
  rondes: number;
};

export type TournamentCreateInput = {
  naam: string;      
  rondes: number;  
  type: TournamentType;
  participations: number[];    
};

export interface TournamentUpdateInput extends TournamentCreateInput {}

export interface CreateTournamentRequest extends TournamentCreateInput {}
export interface UpdateTournamentRequest extends TournamentUpdateInput {}

export interface GetAllTournamentenResponse extends ListResponse<Tournament> {}
export interface GetTournamentByIdResponse extends Tournament {}
export interface CreateTournamentResponse extends GetTournamentByIdResponse {}
export interface UpdateTournamentResponse extends GetTournamentByIdResponse {}