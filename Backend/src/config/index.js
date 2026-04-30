// Load environment variables
const env = process.env;

export const config = {
  // Server configuration
  port: parseInt(env.PORT || '3127', 10),
  nodeEnv: env.NODE_ENV || 'development',
  
  // CORS configuration — CORS_ORIGIN is required in production; dev falls back to localhost.
  cors: {
    origin: (() => {
      if (env.CORS_ORIGIN) {
        return env.CORS_ORIGIN.includes(',')
          ? env.CORS_ORIGIN.split(',').map(o => o.trim())
          : env.CORS_ORIGIN;
      }
      if (env.NODE_ENV === 'production') {
        throw new Error('CORS_ORIGIN environment variable must be set in production');
      }
      return ['http://localhost:5173', 'http://127.0.0.1:5173'];
    })(),
    methods: 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    headers: 'Content-Type, Authorization, X-Requested-With',
  },
  
  // JWT configuration
  jwt: {
    secret: (() => {
      if (env.JWT_SECRET) {
        return env.JWT_SECRET;
      }
      // Enforce JWT_SECRET in all environments — no insecure fallback
      throw new Error('JWT_SECRET environment variable must be set before starting the server');
    })(),
    expiresIn: env.JWT_EXPIRES_IN || '1h', // Default: 1 hour for security
    rememberMeExpiresIn: '7d',
  },
  
  // Database configuration
  database: {
    url: env.DATABASE_URL || 'postgresql://user:password@localhost:5432/minlt?schema=public',
  },
  
  // Supabase configuration
  supabase: {
    url: env.SUPABASE_URL || '',
    anonKey: env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY || '',
    storageBucket: env.SUPABASE_STORAGE_BUCKET || 'regulation-updates',
  },
};

export default config;

