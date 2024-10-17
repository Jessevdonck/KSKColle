// src/types/koa.ts
import type { ParameterizedContext } from 'koa';
import type Application from 'koa';
import type Router from '@koa/router';

// 👇 1
export interface ChessAppState {
}

export interface ChessAppContext<
  Params = unknown,
  RequestBody = unknown,
  Query = unknown,
> {
  request: {
    body: RequestBody;
    query: Query;
  };
  params: Params;
}

export type KoaContext<
  ResponseBody = unknown,
  Params = unknown,
  RequestBody = unknown,
  Query = unknown,
> = ParameterizedContext<
  ChessAppState,
  ChessAppContext<Params, RequestBody, Query>,
  ResponseBody
>;

export interface KoaApplication extends Application<ChessAppState, ChessAppContext> {}

export interface KoaRouter extends Router<ChessAppState, ChessAppContext> {}