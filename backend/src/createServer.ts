// src/createServer.ts
import Koa from 'koa';

import { getLogger } from './core/logging';
import { initializeData, shutdownData } from './data/index';
import installMiddlewares from './core/installMiddlewares';
import installRest from './REST';
import type {
  KoaApplication,
  ChessAppContext,
  ChessAppState,
} from './types/koa'; // 👈 1
import config from 'config';

// 👇 1
export interface Server {
  getApp(): KoaApplication;
  start(): Promise<void>;
  stop(): Promise<void>;
}

const PORT = config.get<number>('port');

// 👇 2
export default async function createServer(): Promise<Server> {
  const app = new Koa<ChessAppState, ChessAppContext>();

  installMiddlewares(app);
  await initializeData();
  installRest(app);

  return {
    getApp() {
      return app;
    },

    start() {
      return new Promise<void>((resolve) => {
        app.listen(PORT, () => {
          getLogger().info(`🚀 Server listening on http://localhost:${PORT}`);
          resolve();
        });
      });
    },

    async stop() {
      app.removeAllListeners();
      await shutdownData();
      getLogger().info('Goodbye! 👋');
    },
  };
}