import type { ListResponse } from "./common";

export type User = {
  user_id: number;
  voornaam: string;
  achternaam: string;
  email: string;
  geboortedatum: Date;
  schaakrating_elo: number;
  max_rating?: number | null;           
  rating_difference?: number | null;    
  is_admin?: boolean | null;            
  fide_id?: number | null;                    
  lid_sinds: Date;
};

export type UserCreateInput = {
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

export interface UserUpdateInput extends UserCreateInput {}

export interface CreateUserRequest extends UserCreateInput {}
export interface UpdateUserRequest extends UserUpdateInput {}

export interface GetAllUserResponse extends ListResponse<User> {}
export interface GetUserByIdResponse extends User {}
export interface GetUserByNaamResponse extends User {}
export interface CreateUserResponse extends GetUserByIdResponse {}
export interface UpdateUserResponse extends GetUserByIdResponse {}
