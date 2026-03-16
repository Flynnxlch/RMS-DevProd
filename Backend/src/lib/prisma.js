import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

// Validate DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in environment variables');
  console.error('Please check your .env file in the Backend directory');
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Test connection on startup
async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connection established');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('\nTroubleshooting steps:');
    console.error('1. Check your DATABASE_URL in Backend/.env file');
    console.error('2. Verify your Supabase database is running and accessible');
    console.error('3. Check your network connection');
    console.error('4. For Supabase: Ensure your database is not paused');
    console.error('5. Confirm DATABASE_URL uses the session pooler (port 5432 on pooler.supabase.com)');
  }
}

// Test connection (non-blocking)
if (typeof process !== 'undefined') {
  testConnection().catch(console.error);
}

// Graceful shutdown
if (typeof process !== 'undefined') {
  const shutdown = async () => {
    try {
      await prisma.$disconnect();
      console.log('Database connection closed');
    } catch (error) {
      console.error('Error closing database connection:', error);
    }
  };

  process.on('beforeExit', shutdown);
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

export default prisma;
