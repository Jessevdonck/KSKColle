import type { ListResponse } from "./common";

export type Speler = {
  user_id: number;
  voornaam: string;
  achternaam: string;
  geboortedatum: Date;
  schaakrating_elo: number;
  max_rating?: number | null;           
  rating_difference?: number | null;    
  is_admin?: boolean | null;            
  fide_id?: number | null;                    
  lid_sinds: Date;
};

export type SpelerCreateInput = {
  voornaam: string;
  achternaam: string;
  geboortedatum: Date;
  email: string;
  tel_nummer: string;
  schaakrating_elo: number;
  max_rating?: number | null;
  rating_difference?: number | null;
  is_admin?: boolean | null;
  fide_id?: number | null;
  lid_sinds: Date;
};

export interface SpelerUpdateInput extends SpelerCreateInput {}

export interface CreateSpelerRequest extends SpelerCreateInput {}
export interface UpdateSpelerRequest extends SpelerUpdateInput {}

export interface GetAllSpelersResponse extends ListResponse<Speler> {}
export interface GetSpelerByIdResponse extends Speler {}
export interface GetSpelerByNaamResponse extends Speler {}
export interface CreateSpelerResponse extends GetSpelerByIdResponse {}
export interface UpdateSpelerResponse extends GetSpelerByIdResponse {}
