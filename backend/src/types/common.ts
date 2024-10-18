// src/types/common.ts
export interface Entity {
  id: number | string;
}

export interface ListResponse<T> {
  items: T[];
}

export interface IdParams {
  id: number;
}

export interface NameParams {
  id: string;
}