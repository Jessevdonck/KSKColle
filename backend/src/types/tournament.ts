import type { ListResponse } from "./common";
import { TournamentType } from "@prisma/client";

export type Tournament = {
  tournament_id: number;
  naam: string;
  type: TournamentType;  
  rondes: number;
  rating_enabled: boolean;   
  finished: boolean;
  is_youth: boolean; 
};

export type TournamentCreateInput = {
  naam: string;      
  rondes: number;  
  type: TournamentType;
  rating_enabled: boolean;
  participations: number[];   
  is_youth: boolean; 
};

export interface TournamentUpdateInput {
  naam: string;      
  rondes: number;  
  type: TournamentType;
  rating_enabled: boolean;
  participations: number[];   
  is_youth: boolean; 
}

export interface UpdateTournamentRequest extends TournamentUpdateInput {}

export interface GetAllTournamentenResponse extends ListResponse<Tournament> {}
export interface GetTournamentByIdResponse extends Tournament {}
export interface UpdateTournamentResponse extends GetTournamentByIdResponse {}