import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import installRest from './REST'; 
import { getLogger } from './core/logging';
import config from 'config';
import koaCors from '@koa/cors';
import { initializeData } from './service/data';

const CORS_ORIGINS = config.get<string[]>('cors.origins'); 
const CORS_MAX_AGE = config.get<number>('cors.maxAge'); 

const app = new Koa();

async function main(): Promise<void> {
  // middlewares

  await initializeData(); // 👈 4
  app.use(
    koaCors({
      // 👇 4
      origin: (ctx) => {
        // 👇 5
        if (CORS_ORIGINS.indexOf(ctx.request.header.origin!) !== -1) {
          return ctx.request.header.origin!;
        }
        return CORS_ORIGINS[0] || ''; // 👈 6
      },
   
      allowHeaders: ['Accept', 'Content-Type', 'Authorization'],
      maxAge: CORS_MAX_AGE, 
    }),
  );
  
  app.use(bodyParser());
  
  installRest(app);
  
  app.listen(9000, () => {
    getLogger().info('🚀 Server listening on http://127.0.0.1:9000');
  });
  // rest laag + listen
}

main();
