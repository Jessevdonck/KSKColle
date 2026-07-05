// src/createServer.ts
import Koa from 'koa';

import { getLogger } from './core/logging';
import { initializeData, shutdownData } from './data/index';
import installMiddlewares from './core/installMiddlewares';
import installRest from './REST';
import { summaryInterval } from './core/apiMonitoring';
import { startJubileumScheduler, stopJubileumScheduler } from './service/jubileumService';
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
          // Meld jubilarissen (25/50 jaar lid) aan admins bij het begin van het jaar
          startJubileumScheduler();
          resolve();
        });
      });
    },

    async stop() {
      if (summaryInterval) clearInterval(summaryInterval);
      stopJubileumScheduler();
      app.removeAllListeners();
      await shutdownData();
      getLogger().info('Goodbye! 👋');
    },
  };
}