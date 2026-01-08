import { PrismaClient } from '@prisma/client';
import { getLogger } from '../core/logging';
import config from 'config';

// Configure Prisma with optimized logging to reduce overhead
// Connection pooling is handled via DATABASE_URL query parameters if needed
// Example: mysql://user:pass@host/db?connection_limit=5
const prismaOptions: any = {
  log: config.get<string>('env') === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'], // Only log errors in production
};

export const prisma = new PrismaClient(prismaOptions);

export async function initializeData(): Promise<void> {
  const logger = getLogger();
  
  // Log database URL (mask password for security)
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    const maskedUrl = databaseUrl.replace(/:([^:@]+)@/, ':****@');
    logger.info('Connecting to database', { databaseUrl: maskedUrl });
  } else {
    logger.warn('DATABASE_URL environment variable is not set');
  }

  await prisma.$connect();

  logger.info('Succesfully connected to the database');
}

export async function shutdownData(): Promise<void> {
  getLogger().info('Shutting down database connection');

  await prisma?.$disconnect();

  getLogger().info('Database connection closed');
}