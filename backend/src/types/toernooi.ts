import type { ListResponse } from "./common";

export type Toernooi = {
  tournament_id: number;
  naam: string;
  rondes: number;
};

export type ToernooiCreateInput = {
  naam: string;      
  rondes: number;  
  participations: number[];    
};

export interface ToernooiUpdateInput extends ToernooiCreateInput {}

export interface CreateToernooiRequest extends ToernooiCreateInput {}
export interface UpdateToernooiRequest extends ToernooiUpdateInput {}

export interface GetAllToernooienResponse extends ListResponse<Toernooi> {}
export interface GetToernooiByIdResponse extends Toernooi {}
export interface CreateToernooiResponse extends GetToernooiByIdResponse {}
export interface UpdateToernooiResponse extends GetToernooiByIdResponse {}