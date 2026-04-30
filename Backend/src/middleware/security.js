import { config } from '../config/index.js';

/**
 * Security headers middleware
 * Adds security headers to responses (Helmet equivalent)
 */
export function securityHeaders(request, response) {
  const headers = new Headers(response.headers);
  
  // Prevent MIME type sniffing
  headers.set('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  headers.set('X-Frame-Options', 'DENY');
  
  // XSS Protection (legacy, but still useful)
  headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy (restrict browser features)
  headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // HSTS (if using HTTPS - verify via X-Forwarded-Proto)
  const isHttps = request.headers.get('X-Forwarded-Proto') === 'https' ||
                  request.url.startsWith('https://');
  if (isHttps) {
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Content Security Policy
  // script-src: no 'unsafe-inline' — production React bundles do not need it.
  // style-src: 'unsafe-inline' kept for Tailwind utility classes.
  const connectOrigins = Array.isArray(config.cors.origin)
    ? config.cors.origin.join(' ')
    : config.cors.origin;
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    `connect-src 'self' ${connectOrigins}`,
    "frame-ancestors 'none'",
  ].join('; ');
  
  headers.set('Content-Security-Policy', csp);
  
  return headers;
}
