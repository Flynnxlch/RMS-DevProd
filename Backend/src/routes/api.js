import { authController } from '../controllers/auth.js';
import { regulationController } from '../controllers/regulationController.js';
import { requestController } from '../controllers/requestController.js';
import { riskController } from '../controllers/riskController.js';
import { authMiddleware } from '../middleware/auth.js';

/**
 * Extract path parameters from URL pattern
 */
function extractPathParams(pattern, path) {
  const patternParts = pattern.split('/').filter(p => p);
  const pathParts = path.split('/').filter(p => p);
  const params = {};
  
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      const paramName = patternParts[i].slice(1);
      if (i < pathParts.length) {
        params[paramName] = pathParts[i];
      }
    }
  }
  
  return params;
}

/**
 * Match route pattern
 */
function matchRoute(pattern, path) {
  const patternParts = pattern.split('/').filter(p => p);
  const pathParts = path.split('/').filter(p => p);
  
  if (patternParts.length !== pathParts.length) {
    return false;
  }
  
  for (let i = 0; i < patternParts.length; i++) {
    // Skip parameter placeholders (starting with :)
    if (!patternParts[i].startsWith(':')) {
      if (patternParts[i] !== pathParts[i]) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * API route handler
 */
export async function apiRoutes(request, path) {
  const method = request.method;
  
  // Auth endpoints
  if (path === '/auth/login') {
    if (method === 'POST') {
      return authController.login(request);
    }
  }
  
  if (path === '/auth/register') {
    if (method === 'POST') {
      return authController.register(request);
    }
  }
  
  if (path === '/auth/me') {
    if (method === 'GET') {
      const authError = await authMiddleware(request);
      if (authError) return authError;
      return authController.getCurrentUser(request);
    }
  }

  // User management endpoints (admin only)
  if (path === '/users') {
    if (method === 'GET') {
      const authError = await authMiddleware(request);
      if (authError) return authError;
      return authController.getAllUsers(request);
    }
  }

  if (matchRoute('/users/:userId', path)) {
    const params = extractPathParams('/users/:userId', path);
    const { userId } = params;
    
    // Log for debugging
    console.log('User management route matched:', { 
      path, 
      userId, 
      method,
      extractedParams: params,
      userIdType: typeof userId 
    });
    
    if (method === 'PUT' || method === 'PATCH') {
      const authError = await authMiddleware(request);
      if (authError) return authError;
      return authController.updateUser(request, userId);
    }
    if (method === 'DELETE') {
      const authError = await authMiddleware(request);
      if (authError) return authError;
      return authController.deleteUser(request, userId);
    }
  }
  
  // Risk endpoints
  if (path === '/risks') {
    if (method === 'GET') {
      const authError = await authMiddleware(request);
      if (authError) return authError;
      return riskController.getAll(request);
    }
    if (method === 'POST') {
      const authError = await authMiddleware(request);
      if (authError) return authError;
      return riskController.create(request);
    }
  }
  
  // Risk by ID endpoints
  if (matchRoute('/risks/:riskId', path)) {
    const { riskId } = extractPathParams('/risks/:riskId', path);
    
    if (method === 'GET') {
      const authError = await authMiddleware(request);
      if (authError) return authError;
      return riskController.getById(request, riskId);
    }
    if (method === 'PUT' || method === 'PATCH') {
      const authError = await authMiddleware(request);
      if (authError) return authError;
      return riskController.update(request, riskId);
    }
    if (method === 'DELETE') {
      const authError = await authMiddleware(request);
      if (authError) return authError;
      return riskController.delete(request, riskId);
    }
  }
  
  // Risk analysis endpoints
  if (matchRoute('/risks/:riskId/analysis', path)) {
    const { riskId } = extractPathParams('/risks/:riskId/analysis', path);
    
    if (method === 'POST' || method === 'PUT') {
      const authError = await authMiddleware(request);
      if (authError) return authError;
      return riskController.createOrUpdateAnalysis(request, riskId);
    }
  }
  
  // Risk mitigation endpoints
  if (matchRoute('/risks/:riskId/mitigation', path)) {
    const { riskId } = extractPathParams('/risks/:riskId/mitigation', path);
    
    if (method === 'POST' || method === 'PUT') {
      const authError = await authMiddleware(request);
      if (authError) return authError;
      return riskController.createOrUpdateMitigation(request, riskId);
    }
  }
  
  // Risk evaluation endpoints
  if (matchRoute('/risks/:riskId/evaluations', path)) {
    const { riskId } = extractPathParams('/risks/:riskId/evaluations', path);
    
    if (method === 'POST' || method === 'PUT') {
      const authError = await authMiddleware(request);
      if (authError) return authError;
      return riskController.createOrUpdateEvaluation(request, riskId);
    }
  }
  
  // User registration request endpoints
  if (path === '/user-requests/registration') {
    if (method === 'GET') {
      const authError = await authMiddleware(request);
      if (authError) return authError;
      return requestController.getRegistrationRequests(request);
    }
  }
  
  if (matchRoute('/user-requests/registration/:requestId/approve', path)) {
    const { requestId } = extractPathParams('/user-requests/registration/:requestId/approve', path);
    
    if (method === 'POST') {
      const authError = await authMiddleware(request);
      if (authError) return authError;
      return requestController.approveRegistrationRequest(request, requestId);
    }
  }
  
  if (matchRoute('/user-requests/registration/:requestId/reject', path)) {
    const { requestId } = extractPathParams('/user-requests/registration/:requestId/reject', path);
    
    if (method === 'POST') {
      const authError = await authMiddleware(request);
      if (authError) return authError;
      return requestController.rejectRegistrationRequest(request, requestId);
    }
  }
  
  // Other request endpoints
  if (path === '/user-requests/other') {
    if (method === 'GET') {
      const authError = await authMiddleware(request);
      if (authError) return authError;
      return requestController.getOtherRequests(request);
    }
    if (method === 'POST') {
      const authError = await authMiddleware(request);
      if (authError) return authError;
      return requestController.createOtherRequest(request);
    }
  }
  
  if (matchRoute('/user-requests/other/:requestId/approve', path)) {
    const { requestId } = extractPathParams('/user-requests/other/:requestId/approve', path);
    
    if (method === 'POST') {
      const authError = await authMiddleware(request);
      if (authError) return authError;
      return requestController.approveOtherRequest(request, requestId);
    }
  }
  
  if (matchRoute('/user-requests/other/:requestId/reject', path)) {
    const { requestId } = extractPathParams('/user-requests/other/:requestId/reject', path);
    
    if (method === 'POST') {
      const authError = await authMiddleware(request);
      if (authError) return authError;
      return requestController.rejectOtherRequest(request, requestId);
    }
  }
  
  // Regulation updates endpoints
  if (path === '/regulation-updates') {
    if (method === 'GET') {
      // Public endpoint - no auth required for reading
      return regulationController.getAll(request);
    }
    if (method === 'POST') {
      const authError = await authMiddleware(request);
      if (authError) return authError;
      return regulationController.create(request);
    }
  }
  
  if (matchRoute('/regulation-updates/:id', path)) {
    const { id } = extractPathParams('/regulation-updates/:id', path);
    
    if (method === 'GET') {
      // Public endpoint - no auth required for reading
      return regulationController.getById(request);
    }
    if (method === 'PUT' || method === 'PATCH') {
      const authError = await authMiddleware(request);
      if (authError) return authError;
      return regulationController.update(request);
    }
    if (method === 'DELETE') {
      const authError = await authMiddleware(request);
      if (authError) return authError;
      return regulationController.delete(request);
    }
  }
  
  // API info
  if (path === '' || path === '/') {
    return new Response(
      JSON.stringify({
        message: 'MinLT API',
        version: '1.0.0',
        endpoints: {
          auth: {
            'POST /api/auth/login': 'User login',
            'POST /api/auth/register': 'User registration',
            'GET /api/auth/me': 'Get current user',
          },
          risks: {
            'GET /api/risks': 'Get all risks',
            'POST /api/risks': 'Create risk',
            'GET /api/risks/:id': 'Get risk by ID',
            'PUT /api/risks/:id': 'Update risk',
            'DELETE /api/risks/:id': 'Delete risk',
            'POST /api/risks/:id/analysis': 'Create/update risk analysis',
            'POST /api/risks/:id/mitigation': 'Create/update risk mitigation',
            'POST /api/risks/:id/evaluations': 'Create/update risk evaluation',
          },
          requests: {
            'GET /api/user-requests/registration': 'Get registration requests (admin)',
            'POST /api/user-requests/registration/:id/approve': 'Approve registration (admin)',
            'POST /api/user-requests/registration/:id/reject': 'Reject registration (admin)',
            'GET /api/user-requests/other': 'Get other requests (admin)',
            'POST /api/user-requests/other': 'Create other request',
            'POST /api/user-requests/other/:id/approve': 'Approve other request (admin)',
            'POST /api/user-requests/other/:id/reject': 'Reject other request (admin)',
          },
          users: {
            'GET /api/users': 'Get all users (admin)',
            'PUT /api/users/:id': 'Update user (admin)',
            'DELETE /api/users/:id': 'Delete user (admin)',
          },
          regulations: {
            'GET /api/regulation-updates': 'Get all regulation updates (public)',
            'POST /api/regulation-updates': 'Create regulation update (admin)',
            'GET /api/regulation-updates/:id': 'Get regulation update by ID (public)',
            'PUT /api/regulation-updates/:id': 'Update regulation update (admin)',
            'DELETE /api/regulation-updates/:id': 'Delete regulation update (admin)',
          },
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  
  // 404 for unknown API routes
  return new Response(
    JSON.stringify({ error: 'API endpoint not found', path: `/api${path}` }),
    {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
