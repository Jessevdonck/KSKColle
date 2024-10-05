// index.ts
import { getLogger } from './src/core/logging'; // 👈 1
import Koa from 'koa'; // 👈 1

const app = new Koa();

app.use(async (ctx) => {
  ctx.body = 'Hello World from.'; // 👈 2
});

app.listen(9000, () => {
  getLogger().info('🚀 Server listening on http://127.0.0.1:9000');
});