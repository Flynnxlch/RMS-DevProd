import { serve } from 'bun';
import 'dotenv/config';
import { config } from './config/index.js';
import { corsMiddleware, getAllowedOrigin } from './middleware/cors.js';
import { logRequest } from './middleware/logger.js';
import { botDetectionMiddleware, rateLimitMiddleware } from './middleware/rateLimit.js';
import { securityHeaders } from './middleware/security.js';
import { handleRequest } from './routes/index.js';

console.log(`
Starting server on port ${config.port}
`);

const server = serve({
  hostname: '0.0.0.0', // Bind to all interfaces for Nginx
  port: config.port,
  
  async fetch(request) {
    // Apply CORS middleware (must be first)
    const corsResponse = corsMiddleware(request);
    if (corsResponse) return corsResponse;

    // Apply bot detection
    const botResponse = botDetectionMiddleware(request);
    if (botResponse) return botResponse;

    // Apply rate limiting
    const rateLimitResponse = rateLimitMiddleware(request);
    if (rateLimitResponse) {
      // Add CORS headers to rate limit response
      const origin = request.headers.get('origin');
      const allowedOrigin = getAllowedOrigin(origin);
      const headers = new Headers(rateLimitResponse.headers);
      headers.set('Access-Control-Allow-Origin', allowedOrigin);
      headers.set('Access-Control-Allow-Methods', config.cors.methods);
      headers.set('Access-Control-Allow-Headers', config.cors.headers);
      headers.set('Access-Control-Allow-Credentials', 'true');
      return new Response(rateLimitResponse.body, {
        status: rateLimitResponse.status,
        headers,
      });
    }

    // Handle the request
    try {
      const startTime = Date.now();
      const response = await handleRequest(request);
      const responseTime = Date.now() - startTime;
      
      // Log the request (skip logging for dashboard and monitoring endpoints to avoid spam)
      const path = new URL(request.url).pathname;
      if (!path.startsWith('/dashboard') && path !== '/' && !path.startsWith('/monitoring')) {
        logRequest(request, response, responseTime);
      }
      
      // Add security headers first
      let headers = securityHeaders(request, response);
      
      // Add CORS headers with dynamic origin
      const origin = request.headers.get('origin');
      const allowedOrigin = getAllowedOrigin(origin);
      headers.set('Access-Control-Allow-Origin', allowedOrigin);
      headers.set('Access-Control-Allow-Methods', config.cors.methods);
      headers.set('Access-Control-Allow-Headers', config.cors.headers);
      headers.set('Access-Control-Allow-Credentials', 'true');
      
      // Add rate limit headers if available
      if (request.rateLimitHeaders) {
        Object.entries(request.rateLimitHeaders).forEach(([key, value]) => {
          headers.set(key, value);
        });
      }
      
      return new Response(response.body, {
        status: response.status,
        headers,
      });
    } catch (error) {
      // Log full error for server logs (with stack trace only in development)
      console.error('Server error:', {
        message: error.message,
        stack: config.nodeEnv === 'development' ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      });
      
      // Return generic error to client (mask stack traces in production)
      const errorResponse = {
        error: 'Internal Server Error',
        ...(config.nodeEnv === 'development' && { 
          details: error.message,
          stack: error.stack 
        })
      };
      
      const origin = request.headers.get('origin');
      const allowedOrigin = getAllowedOrigin(origin);
      let headers = new Headers({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin,
      });
      headers = securityHeaders(request, { headers });
      
      return new Response(
        JSON.stringify(errorResponse),
        {
          status: 500,
          headers,
        }
      );
    }
  },
  
  error(error) {
    console.error('Server error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  },
});

console.log(`✅ Server running on ${server.hostname || '0.0.0.0'}:${server.port}`);

