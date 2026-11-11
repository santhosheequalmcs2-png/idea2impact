import { PrismaClient } from './generated/client/index.js';
import dotenv from 'dotenv';
dotenv.config();

let dbUrl = process.env.DATABASE_URL || '';
if (dbUrl && !dbUrl.includes('connect_timeout')) {
  dbUrl += (dbUrl.includes('?') ? '&' : '?') + 'connect_timeout=30';
}

export const prisma = new PrismaClient({
  datasources: {
    db: { url: dbUrl }
  }
});

export default prisma;
