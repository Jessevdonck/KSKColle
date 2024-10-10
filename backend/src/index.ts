import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import installRest from './REST'; 
import { getLogger } from './core/logging';
import config from 'config';
import koaCors from '@koa/cors';

const CORS_ORIGINS = config.get<string[]>('cors.origins'); // 👈 2
const CORS_MAX_AGE = config.get<number>('cors.maxAge'); // 👈 2

const app = new Koa();

app.use(
  koaCors({
    // 👇 4
    origin: (ctx) => {
      // 👇 5
      if (CORS_ORIGINS.indexOf(ctx.request.header.origin!) !== -1) {
        return ctx.request.header.origin!;
      }
      // Not a valid domain at this point, let's return the first valid as we should return a string
      return CORS_ORIGINS[0] || ''; // 👈 6
    },
    // 👇 7
    allowHeaders: ['Accept', 'Content-Type', 'Authorization'],
    maxAge: CORS_MAX_AGE, // 👈 8
  }),
);

app.use(bodyParser());

installRest(app);

app.listen(9000, () => {
  getLogger().info('🚀 Server listening on http://127.0.0.1:9000');
});