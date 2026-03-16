import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { prisma } from '../lib/prisma.js';

/**
 * Extract JWT token from Authorization header
 */
export function extractToken(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.replace('Bearer ', '');
}

/**
 * Verify JWT token and return user data
 */
export async function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Add retry logic for database connection
    let retries = 3;
    let lastError = null;
    
    while (retries > 0) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            email: true,
            name: true,
            userRole: true,
            regionCabang: true,
            department: true,
            avatar: true,
            memberSince: true,
          },
        });
        return user;
      } catch (dbError) {
        lastError = dbError;
        retries--;
        
        // If it's a connection error, wait before retrying
        if (dbError.message && dbError.message.includes('Can\'t reach database server')) {
          if (retries > 0) {
            console.warn(`Database connection failed, retrying... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            continue;
          }
        }
        
        // If it's not a connection error or no retries left, throw
        throw dbError;
      }
    }
    
    // If all retries failed
    if (lastError) {
      console.error('Database connection error after retries:', lastError.message);
      throw lastError;
    }
    
    return null;
  } catch (error) {
    // Log JWT errors separately from database errors
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      // JWT error - don't log, just return null
      return null;
    }
    
    // Database or other errors - log for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('Token verification error:', error.message);
    }
    
    return null;
  }
}

/**
 * Auth middleware - verifies JWT and attaches user to request
 * Returns null if auth passes, or a Response object if auth fails
 */
export async function authMiddleware(request) {
  const token = extractToken(request);
  
  if (!token) {
    return new Response(
      JSON.stringify({ error: 'No token provided' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const user = await verifyToken(token);
  
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Invalid or expired token' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Attach user to request (we'll pass it through context)
  request.user = user;
  return null;
}

/**
 * Optional auth - doesn't fail if no token, but attaches user if token is valid
 */
export async function optionalAuthMiddleware(request) {
  const token = extractToken(request);
  if (token) {
    const user = await verifyToken(token);
    if (user) {
      request.user = user;
    }
  }
  return null;
}

/**
 * Check if user has required role
 */
export function requireRole(user, ...allowedRoles) {
  if (!user) return false;
  return allowedRoles.includes(user.userRole);
}
