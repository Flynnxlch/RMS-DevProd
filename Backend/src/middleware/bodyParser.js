/**
 * Body parser middleware with size limits
 * Prevents large payload attacks
 */

const MAX_BODY_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Parse request body with size validation
 * @param {Request} request - The incoming request
 * @returns {Promise<object>} - Parsed JSON body
 * @throws {Error} - If body is too large or invalid JSON
 */
export async function parseBody(request) {
  // Check Content-Length header first
  const contentLength = request.headers.get('Content-Length');
  
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (isNaN(size) || size > MAX_BODY_SIZE) {
      throw new Error('Request body too large');
    }
  }
  
  // For Bun, we need to read the body and check size
  // Note: This reads the body, so it can only be called once
  const bodyText = await request.text();
  
  if (bodyText.length > MAX_BODY_SIZE) {
    throw new Error('Request body too large');
  }
  
  // If body is empty, return empty object
  if (!bodyText || bodyText.trim().length === 0) {
    return {};
  }
  
  try {
    return JSON.parse(bodyText);
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
}

/**
 * Create a new request with parsed body attached
 * This allows controllers to use request.body instead of calling parseBody
 */
export async function bodyParserMiddleware(request) {
  try {
    // Only parse if there's a body
    if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
      const contentType = request.headers.get('Content-Type') || '';
      if (contentType.includes('application/json')) {
        // Clone request to avoid consuming the body
        const clonedRequest = request.clone();
        request.body = await parseBody(clonedRequest);
      }
    }
    return null; // Continue processing
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Invalid request body',
        code: 'BODY_TOO_LARGE'
      }),
      {
        status: 413, // Payload Too Large
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
