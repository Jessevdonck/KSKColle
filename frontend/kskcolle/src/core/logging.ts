// src/core/logging.ts
import winston from 'winston'; // 👈 1

// 👇 2
const rootLogger: winston.Logger = winston.createLogger({
  level: 'silly',
  format: winston.format.simple(),
  transports: [new winston.transports.Console()],
});

// 👇 3
export const getLogger = () => {
  return rootLogger;
};