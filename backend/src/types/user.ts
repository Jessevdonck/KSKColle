import type { ListResponse } from "./common";
import type { Prisma } from "@prisma/client";

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
  fide_id?: number | null | undefined;                    
  lid_sinds: Date;
  password_hash: string;
  roles: Prisma.JsonValue;
};

export interface PublicUser extends Pick<User, "user_id" | "voornaam" | "achternaam" | "email" | "geboortedatum" | "schaakrating_elo" | "max_rating" | "rating_difference" | "fide_id" | "lid_sinds" | "roles"> {}


export interface UserUpdateInput extends Pick<UserCreateInput, "voornaam" | "achternaam" | "email" | "schaakrating_elo" | "max_rating" | "rating_difference" | "fide_id" | "password"> {}

export type UserCreateInput = {
  voornaam: string;
  achternaam: string;
  geboortedatum: Date;
  email: string;
  tel_nummer: string;
  vast_nummer?: string;
  schaakrating_elo: number;
  max_rating?: number | null;
  rating_difference?: number | null;
  fide_id?: number | null;
  lid_sinds: Date;
  password: string;
  roles: string[];
  adres_straat: string;      
  adres_nummer: string;   
  adres_bus: string;          
  adres_postcode: string;      
  adres_gemeente: string;       
  adres_land: string;  
};

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface GetUserRequest {
  id: number | 'me'; 
}

export interface RegisterUserRequest {
  voornaam: string;
  achternaam: string;
  geboortedatum: Date;
  email: string;
  tel_nummer: string;
  vast_nummer?: string;
  schaakrating_elo?: number;
  max_rating?: number | null;
  rating_difference?: number | null;
  fide_id?: number | null;
  lid_sinds: Date;
  password: string;
  roles: string[];
  adres_straat: string;      
  adres_nummer: string;   
  adres_bus: string;          
  adres_postcode: string;      
  adres_gemeente: string;       
  adres_land: string;           
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdatePasswordResponse {
  message: string;
}

export interface UpdateUserRequest extends Pick<RegisterUserRequest, 'voornaam' | 'achternaam' | 'email'> {}

export interface UserUpdateInput extends UserCreateInput {}

export interface CreateUserRequest extends UserCreateInput {}
export interface UpdateUserRequest extends UserUpdateInput {}

export interface GetAllUserResponse extends ListResponse<User> {}
export interface GetAllPublicUserResponse extends ListResponse<PublicUser> {}
export interface GetUserByIdResponse extends PublicUser {}
export interface GetUserByNaamResponse extends PublicUser {}
export interface UpdateUserResponse extends GetUserByIdResponse {}
