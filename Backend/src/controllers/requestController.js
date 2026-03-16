import { prisma } from '../lib/prisma.js';
import { requireRole } from '../middleware/auth.js';

/**
 * Request controller - handles user registration requests and other requests
 */
export const requestController = {
  /**
   * Get all user registration requests (admin only)
   */
  getRegistrationRequests: async (request) => {
    try {
      const user = request.user;
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Not authenticated' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (!requireRole(user, 'RISK_ASSESSMENT', 'RISK_CHAMPION')) {
        return new Response(
          JSON.stringify({ error: 'Access denied' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const url = new URL(request.url);
      const statusParam = url.searchParams.get('status');
      const VALID_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];

      const where = {};
      if (statusParam) {
        const normalised = statusParam.toUpperCase();
        if (!VALID_STATUSES.includes(normalised)) {
          return new Response(
            JSON.stringify({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        where.status = normalised;
      } else {
        where.status = 'PENDING'; // Default to pending
      }

      // Risk Champion can only see requests for their region
      if (user.userRole === 'RISK_CHAMPION') {
        where.cabang = user.regionCabang;
      }

      const requests = await prisma.userRegistrationRequest.findMany({
        where,
        include: {
          processedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { requestedAt: 'desc' },
      });

      const formattedRequests = requests.map(req => ({
        id: req.id,
        name: req.name,
        email: req.email,
        cabang: req.cabang,
        nip: req.nip,
        status: req.status.toLowerCase(),
        requestedAt: req.requestedAt.toISOString(),
        processedAt: req.processedAt?.toISOString(),
        processedBy: req.processedBy,
        processedByUser: req.processedByUser ? {
          id: req.processedByUser.id,
          name: req.processedByUser.name,
          email: req.processedByUser.email,
        } : null,
      }));

      return new Response(JSON.stringify({ requests: formattedRequests }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Get registration requests error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  /**
   * Approve user registration request (admin only)
   */
  approveRegistrationRequest: async (request, requestId) => {
    try {
      const user = request.user;
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Not authenticated' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (!requireRole(user, 'RISK_ASSESSMENT', 'RISK_CHAMPION')) {
        return new Response(
          JSON.stringify({ error: 'Access denied' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const regRequest = await prisma.userRegistrationRequest.findUnique({
        where: { id: parseInt(requestId) },
      });

      if (!regRequest) {
        return new Response(
          JSON.stringify({ error: 'Registration request not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (regRequest.status !== 'PENDING') {
        return new Response(
          JSON.stringify({ error: 'Request already processed' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: regRequest.email },
      });

      if (existingUser) {
        return new Response(
          JSON.stringify({ error: 'User already exists' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // This represents when the admin approved the request (current month/year)
      const now = new Date();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const memberSince = `${months[now.getMonth()]}. ${now.getFullYear()}`;

      // Create user from registration request
      // Fields match registration form: Nama (name), Email, Cabang (regionCabang), NIP, Password
      const newUser = await prisma.user.create({
        data: {
          email: regRequest.email,
          passwordHash: regRequest.passwordHash,
          name: regRequest.name, // Nama from registration form
          nip: regRequest.nip, // NIP from registration form
          regionCabang: regRequest.cabang, // Cabang from registration form
          userRole: 'RISK_OFFICER',
          memberSince: memberSince, // Set to current month/year when approved
        },
      });

      // Update request status
      await prisma.userRegistrationRequest.update({
        where: { id: regRequest.id },
        data: {
          status: 'APPROVED',
          processedAt: new Date(),
          processedBy: user.id,
        },
      });

      return new Response(
        JSON.stringify({
          message: 'Registration request approved and user created',
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Approve registration request error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  /**
   * Reject user registration request (admin only)
   */
  rejectRegistrationRequest: async (request, requestId) => {
    try {
      const user = request.user;
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Not authenticated' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (!requireRole(user, 'RISK_ASSESSMENT', 'RISK_CHAMPION')) {
        return new Response(
          JSON.stringify({ error: 'Access denied' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const regRequest = await prisma.userRegistrationRequest.findUnique({
        where: { id: parseInt(requestId) },
      });

      if (!regRequest) {
        return new Response(
          JSON.stringify({ error: 'Registration request not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (regRequest.status !== 'PENDING') {
        return new Response(
          JSON.stringify({ error: 'Request already processed' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Update request status
      await prisma.userRegistrationRequest.update({
        where: { id: regRequest.id },
        data: {
          status: 'REJECTED',
          processedAt: new Date(),
          processedBy: user.id,
        },
      });

      return new Response(
        JSON.stringify({ message: 'Registration request rejected' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Reject registration request error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  /**
   * Get all other requests (admin only)
   */
  getOtherRequests: async (request) => {
    try {
      const user = request.user;
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Not authenticated' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (!requireRole(user, 'RISK_ASSESSMENT', 'RISK_CHAMPION')) {
        return new Response(
          JSON.stringify({ error: 'Access denied' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const url = new URL(request.url);
      const status = url.searchParams.get('status');
      const type = url.searchParams.get('type');

      const where = {};
      if (status) {
        where.status = status.toUpperCase();
      }
      if (type) {
        where.type = type.toUpperCase();
      }

      const requests = await prisma.otherRequest.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          processedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { requestedAt: 'desc' },
      });

      const formattedRequests = requests.map(req => ({
        id: req.id,
        userId: req.userId,
        user: req.user,
        type: req.type.toLowerCase().replace('_', ' '),
        detail: req.detail,
        status: req.status.toLowerCase(),
        requestedAt: req.requestedAt.toISOString(),
        processedAt: req.processedAt?.toISOString(),
        processedBy: req.processedBy,
        processedByUser: req.processedByUser,
      }));

      return new Response(JSON.stringify({ requests: formattedRequests }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Get other requests error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  /**
   * Create other request
   */
  createOtherRequest: async (request) => {
    try {
      const user = request.user;
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Not authenticated' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const body = await request.json();
      const { type, detail } = body;

      if (!type || !detail) {
        return new Response(
          JSON.stringify({ error: 'Type and detail are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const requestType = type.toUpperCase().replace(' ', '_');
      if (!['ADMIN_ACCESS', 'PASSWORD_RESET', 'OTHER'].includes(requestType)) {
        return new Response(
          JSON.stringify({ error: 'Invalid request type' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const otherRequest = await prisma.otherRequest.create({
        data: {
          userId: user.id,
          type: requestType,
          detail: detail.trim(),
          status: 'PENDING',
        },
      });

      return new Response(
        JSON.stringify({
          message: 'Request submitted successfully',
          request: {
            id: otherRequest.id,
            type: otherRequest.type,
            status: otherRequest.status,
          },
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Create other request error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  /**
   * Approve other request (admin only)
   */
  approveOtherRequest: async (request, requestId) => {
    try {
      const user = request.user;
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Not authenticated' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (!requireRole(user, 'RISK_ASSESSMENT', 'RISK_CHAMPION')) {
        return new Response(
          JSON.stringify({ error: 'Access denied' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const otherRequest = await prisma.otherRequest.findUnique({
        where: { id: parseInt(requestId) },
      });

      if (!otherRequest) {
        return new Response(
          JSON.stringify({ error: 'Request not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (otherRequest.status !== 'PENDING') {
        return new Response(
          JSON.stringify({ error: 'Request already processed' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Handle different request types
      if (otherRequest.type === 'ADMIN_ACCESS') {
        // Only RISK_ASSESSMENT (the highest role) can grant role elevation.
        // A RISK_CHAMPION must not be able to elevate another user to their own level.
        if (user.userRole !== 'RISK_ASSESSMENT') {
          return new Response(
            JSON.stringify({ error: 'Only Risk Assessment can approve role-elevation requests.' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
        // Upgrade the requesting user to RISK_CHAMPION
        await prisma.user.update({
          where: { id: otherRequest.userId },
          data: {
            userRole: 'RISK_CHAMPION',
          },
        });
      } else if (otherRequest.type === 'PASSWORD_RESET') {
        // Password reset would typically send an email with reset link
        // For now, we just mark it as approved
      }

      await prisma.otherRequest.update({
        where: { id: otherRequest.id },
        data: {
          status: 'APPROVED',
          processedAt: new Date(),
          processedBy: user.id,
        },
      });

      return new Response(
        JSON.stringify({ message: 'Request approved' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Approve other request error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  /**
   * Reject other request (admin only)
   */
  rejectOtherRequest: async (request, requestId) => {
    try {
      const user = request.user;
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Not authenticated' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (!requireRole(user, 'RISK_ASSESSMENT', 'RISK_CHAMPION')) {
        return new Response(
          JSON.stringify({ error: 'Access denied' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const otherRequest = await prisma.otherRequest.findUnique({
        where: { id: parseInt(requestId) },
      });

      if (!otherRequest) {
        return new Response(
          JSON.stringify({ error: 'Request not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (otherRequest.status !== 'PENDING') {
        return new Response(
          JSON.stringify({ error: 'Request already processed' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      await prisma.otherRequest.update({
        where: { id: otherRequest.id },
        data: {
          status: 'REJECTED',
          processedAt: new Date(),
          processedBy: user.id,
        },
      });

      return new Response(
        JSON.stringify({ message: 'Request rejected' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Reject other request error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
};
