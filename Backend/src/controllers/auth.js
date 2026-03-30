import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { prisma } from '../lib/prisma.js';
import { requireRole } from '../middleware/auth.js';
import { clearLoginFailures, isLoginLocked, recordLoginFailure } from '../middleware/rateLimit.js';
import { checkConcurrentLoginLimit, removeUserSession, trackUserSession } from '../middleware/session.js';

/**
 * Auth controller - handles authentication-related API endpoints
 */
export const authController = {
  /**
   * User login
   */
  login: async (request) => {
    try {
      const body = await request.json();
      const { email, password } = body;
      
      // Validate input
      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: 'Email and password are required' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Resolve the client IP for lockout tracking
      const forwarded = request.headers.get('X-Forwarded-For');
      const clientIp = forwarded ? forwarded.split(',')[0].trim() : (request.headers.get('X-Real-IP') || 'unknown');

      // Check if this IP is currently locked out due to too many failed attempts
      const lockCheck = isLoginLocked(clientIp);
      if (lockCheck.locked) {
        return new Response(
          JSON.stringify({
            error: 'Too many failed login attempts. Please try again later.',
            retryAfter: lockCheck.retryAfter,
          }),
          {
            status: 429,
            headers: { 'Content-Type': 'application/json', 'Retry-After': String(lockCheck.retryAfter) },
          }
        );
      }

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        recordLoginFailure(clientIp);
        return new Response(
          JSON.stringify({ error: 'Invalid email or password' }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.passwordHash);

      if (!isValid) {
        const failResult = recordLoginFailure(clientIp);
        return new Response(
          JSON.stringify({
            error: 'Invalid email or password',
            ...(failResult.locked && { retryAfter: failResult.retryAfter }),
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Successful authentication — clear failure counter
      clearLoginFailures(clientIp);
      
      // Check concurrent login limit
      const loginLimitCheck = await checkConcurrentLoginLimit();
      if (!loginLimitCheck.allowed) {
        return new Response(
          JSON.stringify({ error: loginLimitCheck.message }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      
      // Check for "remember me" option (7 days) or default (1 hour for security)
      const rememberMe = body.rememberMe === true;
      const tokenExpiry = rememberMe ? '7d' : '1h'; // Changed from 24h to 1h for security
      
      // Track user session and device (pass rememberMe so TTL is stored correctly)
      const sessionInfo = await trackUserSession(request, user, rememberMe);

      // Generate JWT token (include sessionId so logout can identify the exact session)
      const token = jwt.sign(
        { userId: user.id, email: user.email, rememberMe, sessionId: sessionInfo.sessionId },
        config.jwt.secret,
        { expiresIn: tokenExpiry }
      );

      // Return user data (without password)
      const userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.userRole,
        userRole: user.userRole,
        regionCabang: user.regionCabang,
        department: user.department,
        avatar: user.avatar,
        memberSince: user.memberSince,
      };
      
      // Prepare response data
      const responseData = {
        message: 'Login successful',
        user: userData,
        token,
        expiresIn: rememberMe ? '7 days' : '1 hour',
      };
      
      // Add device warning if needed
      if (sessionInfo.shouldWarn) {
        responseData.warning = sessionInfo.warningMessage;
        responseData.deviceCount = sessionInfo.deviceCount;
      }
      
      return new Response(
        JSON.stringify(responseData),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('Login error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },
  
  /**
   * User registration (creates a registration request)
   * Security: Prevents double submission and ensures only requests are created, not users
   */
  register: async (request) => {
    try {
      const body = await request.json();
      const { name, email, cabang, nip, password, confirmPassword } = body;
      
      // Validate input
      if (!name || !email || !cabang || !password) {
        return new Response(
          JSON.stringify({ error: 'Name, email, cabang, and password are required' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      
      if (password !== confirmPassword) {
        return new Response(
          JSON.stringify({ error: 'Passwords do not match' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      
      if (password.length < 6) {
        return new Response(
          JSON.stringify({ error: 'Password must be at least 6 characters' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return new Response(
          JSON.stringify({ error: 'Invalid email format' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      
      // Check if email already exists in users table (prevents bypass)
      const existingUser = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      });
      
      if (existingUser) {
        return new Response(
          JSON.stringify({ error: 'Email already registered' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      
      // Check if there's already a pending or approved request (prevents double submission)
      const existingRequest = await prisma.userRegistrationRequest.findFirst({
        where: {
          email: email.trim().toLowerCase(),
          status: {
            in: ['PENDING', 'APPROVED'],
          },
        },
      });
      
      if (existingRequest) {
        if (existingRequest.status === 'PENDING') {
          return new Response(
            JSON.stringify({ error: 'Registration request already pending. Please wait for approval.' }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        } else {
          return new Response(
            JSON.stringify({ error: 'Registration request already approved. Please login instead.' }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Create registration request ONLY (never create user directly)
      // User will be created only when admin approves the request
      const registrationRequest = await prisma.userRegistrationRequest.create({
        data: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          cabang: cabang.trim(),
          nip: nip ? nip.trim() : null,
          passwordHash,
          status: 'PENDING', // Always start as PENDING
        },
      });
      
      return new Response(
        JSON.stringify({
          message: 'Registration request submitted successfully. Please wait for admin approval.',
          requestId: registrationRequest.id,
        }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle unique constraint violation (race condition)
      if (error.code === 'P2002') {
        return new Response(
          JSON.stringify({ error: 'Registration request already exists. Please wait for approval.' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },
  
  /**
   * Get current user from token
   */
  getCurrentUser: async (request) => {
    try {
      const user = request.user;
      
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Not authenticated' }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      
      const userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.userRole,
        userRole: user.userRole,
        regionCabang: user.regionCabang,
        department: user.department,
        avatar: user.avatar,
        memberSince: user.memberSince,
      };
      
      return new Response(JSON.stringify({ user: userData }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Get current user error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },

  /**
   * Get all users (admin only)
   */
  getAllUsers: async (request) => {
    try {
      const user = request.user;
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Not authenticated' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (!requireRole(user, 'RISK_ASSESSMENT')) {
        return new Response(
          JSON.stringify({ error: 'Access denied. Only Risk Assessment can manage users.' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const where = {};

      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          nip: true,
          userRole: true,
          regionCabang: true,
          department: true,
          avatar: true,
          memberSince: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return new Response(JSON.stringify({ users }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Get all users error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  /**
   * Update user (admin only)
   */
  updateUser: async (request, userId) => {
    try {
      const user = request.user;
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Not authenticated' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (!requireRole(user, 'RISK_ASSESSMENT')) {
        return new Response(
          JSON.stringify({ error: 'Access denied. Only Risk Assessment can manage users.' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Validate userId first, before parsing body
      if (!userId || userId === 'undefined' || userId === 'null') {
        return new Response(
          JSON.stringify({ error: 'Invalid user ID: userId is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const userIdInt = parseInt(userId, 10);
      if (isNaN(userIdInt) || userIdInt <= 0) {
        return new Response(
          JSON.stringify({ error: 'Invalid user ID' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const body = await request.json();
      const { name, email, nip, userRole, regionCabang, department, password } = body;

      // Check if user exists
      const targetUser = await prisma.user.findUnique({
        where: { id: userIdInt },
      });

      if (!targetUser) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Risk Champion can only update users from their region
      // Prepare update data
      const updateData = {};
      if (name !== undefined && name !== null && typeof name === 'string') {
        const nameTrimmed = name.trim();
        if (nameTrimmed) updateData.name = nameTrimmed;
      }
      if (email !== undefined && email !== null && typeof email === 'string') {
        const emailTrimmed = email.trim();
        if (!emailTrimmed) {
          return new Response(
            JSON.stringify({ error: 'Email cannot be empty' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        // Check if email is already taken by another user
        const existingUser = await prisma.user.findFirst({
          where: {
            email: emailTrimmed,
            id: { not: userIdInt },
          },
        });
        if (existingUser) {
          return new Response(
            JSON.stringify({ error: 'Email already in use' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        updateData.email = emailTrimmed;
      }
      if (nip !== undefined) {
        updateData.nip = (nip && typeof nip === 'string' && nip.trim()) ? nip.trim() : null;
      }
      if (userRole !== undefined && userRole !== null) {
        // Only RISK_ASSESSMENT can change roles
        if (user.userRole !== 'RISK_ASSESSMENT') {
          return new Response(
            JSON.stringify({ error: 'Only RISK_ASSESSMENT can change user roles' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
        updateData.userRole = userRole;
      }
      if (regionCabang !== undefined && regionCabang !== null && typeof regionCabang === 'string') {
        const regionTrimmed = regionCabang.trim();
        if (regionTrimmed) updateData.regionCabang = regionTrimmed;
      }
      if (department !== undefined) {
        updateData.department = (department && typeof department === 'string' && department.trim()) ? department.trim() : null;
      }
      if (password !== undefined && password !== null && typeof password === 'string' && password.trim() !== '') {
        const passwordTrimmed = password.trim();
        if (passwordTrimmed.length < 6) {
          return new Response(
            JSON.stringify({ error: 'Password must be at least 6 characters' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        updateData.passwordHash = await bcrypt.hash(passwordTrimmed, 10);
      }

      // Check if there's any data to update
      if (Object.keys(updateData).length === 0) {
        return new Response(
          JSON.stringify({ error: 'No data provided to update' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const updatedUser = await prisma.user.update({
        where: { id: userIdInt },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          nip: true,
          userRole: true,
          regionCabang: true,
          department: true,
          avatar: true,
          memberSince: true,
        },
      });

      return new Response(JSON.stringify({ user: updatedUser }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Update user error:', error.message, error.stack);
      } else {
        console.error('Update user error:', error.message);
      }

      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  /**
   * Delete user (admin only)
   */
  deleteUser: async (request, userId) => {
    try {
      const user = request.user;
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Not authenticated' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (!requireRole(user, 'RISK_ASSESSMENT')) {
        return new Response(
          JSON.stringify({ error: 'Access denied. Only Risk Assessment can manage users.' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check if user exists
      const targetUser = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
      });

      if (!targetUser) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Prevent self-deletion
      if (targetUser.id === user.id) {
        return new Response(
          JSON.stringify({ error: 'Cannot delete your own account' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      await prisma.user.delete({
        where: { id: parseInt(userId) },
      });

      return new Response(
        JSON.stringify({ message: 'User deleted successfully' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Delete user error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  /**
   * Logout — removes the in-memory session so the monitor reflects the correct state.
   * Reads sessionId from the JWT payload (embedded at login) to avoid IP/UA mismatch issues.
   */
  logout: async (request) => {
    try {
      const user = request.user;
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Not authenticated' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Decode the JWT (already verified by authMiddleware) to get the sessionId
      const authHeader = request.headers.get('Authorization') || '';
      const token = authHeader.replace('Bearer ', '');
      const decoded = jwt.decode(token);
      const sessionId = decoded?.sessionId;

      if (sessionId) {
        removeUserSession(user.id, sessionId);
      }

      return new Response(
        JSON.stringify({ message: 'Logged out successfully' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Logout error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
};
