import type { ListResponse } from "./common";
import type { Prisma } from "@prisma/client";

export type User = {
  user_id: number;
  voornaam: string;
  achternaam: string;
  email: string;
  tel_nummer: string;
  vast_nummer?: string | null;
  geboortedatum?: Date | null;
  schaakrating_elo: number;
  max_rating?: number | null;           
  rating_difference?: number | null;    
  is_admin?: boolean | null;            
  is_youth?: boolean | null;            
  fide_id?: number | null | undefined;                    
  lid_sinds: Date;
  password_hash: string;
  roles: Prisma.JsonValue;
  adres_straat?: string | null;
  adres_nummer?: string | null;
  adres_bus?: string | null;
  adres_postcode?: string | null;
  adres_gemeente?: string | null;
  adres_land?: string | null;
  avatar_url?: string | null;
  // Lidgeld status
  lidgeld_betaald: boolean;
  lidgeld_periode_start?: Date | null;
  lidgeld_periode_eind?: Date | null;
  bondslidgeld_betaald: boolean;
  bondslidgeld_periode_start?: Date | null;
  bondslidgeld_periode_eind?: Date | null;
};

export interface PublicUser extends Pick<User, "user_id" | "voornaam" | "achternaam" | "email" | "tel_nummer" | "vast_nummer" | "geboortedatum" | "schaakrating_elo" | "max_rating" | "rating_difference" | "fide_id" | "lid_sinds" | "roles" | "avatar_url" | "lidgeld_betaald" | "lidgeld_periode_start" | "lidgeld_periode_eind" | "bondslidgeld_betaald" | "bondslidgeld_periode_start" | "bondslidgeld_periode_eind"> {}


export interface UserUpdateInput extends Partial<Pick<UserCreateInput, "voornaam" | "achternaam" | "email" | "tel_nummer" | "vast_nummer" | "schaakrating_elo" | "max_rating" | "rating_difference" | "fide_id" | "password" | "roles" | "adres_straat" | "adres_nummer" | "adres_bus" | "adres_postcode" | "adres_gemeente" | "adres_land" | "lidgeld_betaald" | "lidgeld_periode_start" | "lidgeld_periode_eind" | "bondslidgeld_betaald" | "bondslidgeld_periode_start" | "bondslidgeld_periode_eind">> {}

export type UserCreateInput = {
  voornaam: string;
  achternaam: string;
  geboortedatum?: Date | null;
  email?: string;
  tel_nummer?: string;
  vast_nummer?: string;
  schaakrating_elo: number;
  max_rating?: number | null;
  rating_difference?: number | null;
  fide_id?: number | null;
  is_youth?: boolean;
  lid_sinds: Date;
  password: string;
  roles: string[];
  adres_straat?: string;      
  adres_nummer?: string;   
  adres_bus?: string;          
  adres_postcode?: string;      
  adres_gemeente?: string;       
  adres_land?: string;
  // Lidgeld status
  lidgeld_betaald?: boolean;
  lidgeld_periode_start?: Date | null;
  lidgeld_periode_eind?: Date | null;
  bondslidgeld_betaald?: boolean;
  bondslidgeld_periode_start?: Date | null;
  bondslidgeld_periode_eind?: Date | null;
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
  geboortedatum?: Date | null;
  email: string;
  tel_nummer: string;
  vast_nummer?: string;
  schaakrating_elo?: number;
  max_rating?: number | null;
  rating_difference?: number | null;
  fide_id?: number | null;
  is_youth?: boolean;
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

export interface CreateUserRequest extends UserCreateInput {}

export interface UpdateUserRequest extends Partial<Pick<RegisterUserRequest, 'voornaam' | 'achternaam' | 'email' | 'tel_nummer' | 'vast_nummer' | 'schaakrating_elo' | 'max_rating' | 'rating_difference' | 'fide_id' | 'is_youth' | 'adres_straat' | 'adres_nummer' | 'adres_bus' | 'adres_postcode' | 'adres_gemeente' | 'adres_land'>> {}

export interface GetAllUserResponse extends ListResponse<User> {}
export interface GetAllPublicUserResponse extends ListResponse<PublicUser> {}
export interface GetUserByIdResponse extends PublicUser {}
export interface GetUserByNaamResponse extends PublicUser {}
export interface UpdateUserResponse extends GetUserByIdResponse {}
