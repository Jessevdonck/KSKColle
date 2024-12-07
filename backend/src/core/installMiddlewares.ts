import config from 'config';
import bodyParser from 'koa-bodyparser';
import koaCors from '@koa/cors';
import { getLogger } from './logging';
import { KoaContext } from '../types/koa';
import ServiceError from './serviceError';
import koaHelmet from 'koa-helmet';

const NODE_ENV = config.get<string>('env');

const CORS_ORIGINS = config.get<string[]>('cors.origins');
const CORS_MAX_AGE = config.get<number>('cors.maxAge');

export default function installMiddlewares(app: any) {
  app.use(
    koaCors({
      origin: (ctx) => {
        if (CORS_ORIGINS.indexOf(ctx.request.header.origin!) !== -1) {
          return ctx.request.header.origin!;
        }
        return CORS_ORIGINS[0] || '';
      },
      allowHeaders: ['Accept', 'Content-Type', 'Authorization'],
      maxAge: CORS_MAX_AGE,
    }),
  );

  app.use(async (ctx: KoaContext, next: () => any) => {
    getLogger().info(`⏩ ${ctx.method} ${ctx.url}`);
  
    const getStatusEmoji = () => {
      if (ctx.status >= 500) return '💀';
      if (ctx.status >= 400) return '❌';
      if (ctx.status >= 300) return '🔀';
      if (ctx.status >= 200) return '✅';
      return '🔄';
    };
    
    await next();
  
    getLogger().info(
      `${getStatusEmoji()} ${ctx.method} ${ctx.status} ${ctx.url}`,
    );
  });

  app.use(async (ctx: KoaContext, next: () => Promise<any>) => {
    try {
      await next(); 
    } catch (error: any) {
      getLogger().error('Error occurred while handling a request', { error });
  
      let statusCode = error.status || 500;
      const errorBody = {
        code: error.code || 'INTERNAL_SERVER_ERROR',
        message:
          error.message || 'Unexpected error occurred. Please try again later.',
        details: error.details,
        stack: NODE_ENV !== 'production' ? error.stack : undefined,
      };
  
      if (error instanceof ServiceError) {
        errorBody.message = error.message;
  
        if (error.isNotFound) {
          statusCode = 404;
        }
  
        if (error.isValidationFailed) {
          statusCode = 400;
        }
  
        if (error.isUnauthorized) {
          statusCode = 401;
        }
  
        if (error.isForbidden) {
          statusCode = 403;
        }
  
        if (error.isConflict) {
          statusCode = 409;
        }
      }
  
      ctx.status = statusCode;
      ctx.body = errorBody;
    }
  });

  app.use(async (ctx: KoaContext, next: () => Promise<any>) => {
    await next();
  
    if (ctx.status === 404 && !ctx.body) {
      ctx.status = 404;
      ctx.body = {
        code: 'NOT_FOUND',
        message: `Unknown resource: ${ctx.url}`,
      };
    }
  });

  app.use(bodyParser());

  app.use(koaHelmet());
}
