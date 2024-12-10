// src/rest/session.ts
import Router from '@koa/router';
import Joi from 'joi';
import validate from '../core/validation';
import * as userService from '../service/userService';
import type {
  KoaContext,
  KoaRouter,
  ChessAppState,
  ChessAppContext,
} from '../types/koa';
import type { LoginResponse, LoginRequest } from '../types/user';
import { authDelay } from '../core/auth';

const login = async (ctx: KoaContext<LoginResponse, void, LoginRequest>) => {
  const { email, password } = ctx.request.body;
  const token = await userService.login(email, password); 

  ctx.status = 200;
  ctx.body = { token };
};
login.validationScheme = {
  body: {
    email: Joi.string().email(),
    password: Joi.string(),
  },
};

export default function installSessionRouter(parent: KoaRouter) {
  const router = new Router<ChessAppState, ChessAppContext>({
    prefix: '/sessions',
  });

  router.post('/', authDelay, validate(login.validationScheme), login);

  parent.use(router.routes()).use(router.allowedMethods());
}