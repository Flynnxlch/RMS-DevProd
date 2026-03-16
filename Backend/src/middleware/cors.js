import { config } from '../config/index.js';

/**
 * Check if origin is allowed
 */
function isOriginAllowed(origin) {
  if (!origin) return false;
  
  const allowedOrigins = Array.isArray(config.cors.origin) 
    ? config.cors.origin 
    : [config.cors.origin];
  
  // Allow localhost variants
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    return true;
  }
  
  // Allow local network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
  const localNetworkRegex = /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/;
  if (localNetworkRegex.test(origin)) {
    return true;
  }
  
  // Check against configured origins
  return allowedOrigins.includes(origin);
}

/**
 * Get allowed origin for response
 */
function getAllowedOrigin(requestOrigin) {
  if (!requestOrigin) {
    return Array.isArray(config.cors.origin) ? config.cors.origin[0] : config.cors.origin;
  }
  
  if (isOriginAllowed(requestOrigin)) {
    return requestOrigin;
  }
  
  return Array.isArray(config.cors.origin) ? config.cors.origin[0] : config.cors.origin;
}

/**
 * CORS middleware for handling preflight requests
 */
export function corsMiddleware(request) {
  const origin = request.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  
  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': config.cors.methods,
        'Access-Control-Allow-Headers': config.cors.headers,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400', // 24 hours
      },
    });
  }
  
  // Return null to continue processing
  return null;
}

// Export helper function for use in server.js
export { getAllowedOrigin };

