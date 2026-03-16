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
  // Adjust based on your needs - React may need 'unsafe-inline' for styles
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // React needs unsafe-eval in dev
    "style-src 'self' 'unsafe-inline'", // Tailwind/Bootstrap need unsafe-inline
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    `connect-src 'self' ${config.cors.origin}`,
    "frame-ancestors 'none'",
  ].join('; ');
  
  headers.set('Content-Security-Policy', csp);
  
  return headers;
}
