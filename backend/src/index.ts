import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import Router from '@koa/router'; // 👈 1
import { getLogger } from './core/logging';
import * as logicaService from './service/logica'; 

const app = new Koa();

app.use(bodyParser());

const router = new Router(); // 👈 2

// 👇 3
router.get('/api/spelers', async (ctx) => {
  ctx.body = {
    items: logicaService.getAllSpelersAlfabetisch(),
  };
});

router.post('/api/spelers', async (ctx: any) => {
  const addedSpeler = logicaService.addSpeler(ctx.request.body); 
  ctx.status = 201; 
  ctx.body = {
    message: 'Speler succesvol toegevoegd',
    speler: addedSpeler,
  };
});

app
  .use(router.routes()) 
  .use(router.allowedMethods()); 

app.listen(9000, () => {
  getLogger().info('🚀 Server listening on http://127.0.0.1:9000');
});