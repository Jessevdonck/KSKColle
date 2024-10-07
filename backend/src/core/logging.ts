// src/core/logging.ts
import { env } from 'node:process'; // 👈 4
import winston from 'winston';
import config from 'config'; // 👈 1

const NODE_ENV = env['NODE_ENV']; // 👈 4
const LOG_LEVEL = config.get<string>('log.level'); // 👈 2
const LOG_DISABLED = config.get<boolean>('log.disabled'); // 👈 2

// 👇 7
console.log(
  `node env: ${NODE_ENV}, log level ${LOG_LEVEL}, logs enabled: ${
    LOG_DISABLED !== true
  }`,
);

const rootLogger: winston.Logger = winston.createLogger({
  level: LOG_LEVEL, // 👈 3
  format: winston.format.simple(),
  transports: [new winston.transports.Console({ silent: LOG_DISABLED })], // 👈 3
});

export const getLogger = () => {
  return rootLogger;
};