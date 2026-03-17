import { createServer } from 'node:http';
import 'dotenv/config';
import { config } from './config/index.js';
import { corsMiddleware, getAllowedOrigin } from './middleware/cors.js';
import { logRequest } from './middleware/logger.js';
import { botDetectionMiddleware, rateLimitMiddleware } from './middleware/rateLimit.js';
import { securityHeaders } from './middleware/security.js';
import { handleRequest } from './routes/index.js';

console.log(`\nStarting server on port ${config.port}\n`);

/**
 * Core request handler — same logic as before, works with Web API Request/Response.
 * Node.js v18+ has Request/Response as globals (via built-in undici).
 */
async function handleFetch(request) {
  // Apply CORS middleware (must be first)
  const corsResponse = corsMiddleware(request);
  if (corsResponse) return corsResponse;

  // Apply bot detection
  const botResponse = botDetectionMiddleware(request);
  if (botResponse) return botResponse;

  // Apply rate limiting
  const rateLimitResponse = rateLimitMiddleware(request);
  if (rateLimitResponse) {
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

    // Log the request (skip dashboard and monitoring endpoints to avoid spam)
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
    console.error('Server error:', {
      message: error.message,
      stack: config.nodeEnv === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    const errorResponse = {
      error: 'Internal Server Error',
      ...(config.nodeEnv === 'development' && {
        details: error.message,
        stack: error.stack,
      }),
    };

    const origin = request.headers.get('origin');
    const allowedOrigin = getAllowedOrigin(origin);
    let headers = new Headers({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
    });
    headers = securityHeaders(request, { headers });

    return new Response(JSON.stringify(errorResponse), { status: 500, headers });
  }
}

/**
 * Node.js HTTP server — bridges Node IncomingMessage ↔ Web API Request/Response.
 * Requires Node.js v18+ (Request/Response are globals).
 */
const server = createServer(async (req, res) => {
  try {
    // Build full URL from Node.js request
    const host = req.headers.host || `localhost:${config.port}`;
    const url = `http://${host}${req.url}`;

    // Read request body into a Buffer
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const bodyBuffer = chunks.length ? Buffer.concat(chunks) : null;
    const hasBody = !!bodyBuffer && bodyBuffer.length > 0
      && req.method !== 'GET' && req.method !== 'HEAD';

    // Build Web API Headers — handle Node's header format (values can be arrays)
    const webHeaders = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) {
        value.forEach(v => webHeaders.append(key, v));
      } else if (value !== undefined) {
        webHeaders.set(key, value);
      }
    }

    // Create Web API Request
    const request = new Request(url, {
      method: req.method,
      headers: webHeaders,
      body: hasBody ? bodyBuffer : null,
    });

    // Run through middleware + route handler
    const response = await handleFetch(request);

    // Write status + headers to Node.js response
    res.statusCode = response.status;
    for (const [key, value] of response.headers.entries()) {
      res.setHeader(key, value);
    }

    // Write body
    if (response.body) {
      const buffer = Buffer.from(await response.arrayBuffer());
      res.end(buffer);
    } else {
      res.end();
    }
  } catch (error) {
    console.error('Unhandled server error:', error.message);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
  }
});

server.listen(config.port, '0.0.0.0', () => {
  console.log(`✅ Server running on 0.0.0.0:${config.port}`);
});

// Graceful shutdown
const shutdown = () => {
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
