import type { Next } from 'koa'; 
import type { KoaContext } from '../types/koa'; 
import * as userService from '../service/userService'; 
import config from 'config';

export const requireAuthentication = async (ctx: KoaContext, next: Next) => {
  const { authorization } = ctx.headers; 

  try {
    ctx.state.session = await userService.checkAndParseSession(authorization);
  } catch (error: any) {
    if (error.name === 'ServiceError' && error.isUnauthorized) {
      ctx.throw(401, 'Gebruiker niet geauthenticeerd', { code: 'UNAUTHORIZED' });
    }
    throw error;
  }

  return next(); 
};

export const makeRequireRole = (role: string) => async (ctx: KoaContext, next: Next) => {
  const { roles = [] } = ctx.state.session; 

  if (!roles.includes(role)) {
    ctx.throw(403, 'You are not allowed to view this part of the application', { code: 'FORBIDDEN' });
  }

  return next();
};

const AUTH_MAX_DELAY = config.get<number>('auth.maxDelay'); 

export const authDelay = async (_: KoaContext, next: Next) => {
  await new Promise((resolve) => {
    const delay = Math.round(Math.random() * AUTH_MAX_DELAY);
    setTimeout(resolve, delay);
  });
  return next();
};