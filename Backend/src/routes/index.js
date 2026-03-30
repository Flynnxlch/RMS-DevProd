import { apiRoutes } from './api.js';
import { getCurrentSessions } from '../middleware/session.js';
import { getDetectionHistory } from '../middleware/rateLimit.js';
import { getLogs, clearLogs, pauseLogging, startLogging, getLoggingStatus, exportLogsToCSV, exportLogsToXLSX } from '../middleware/logger.js';
import { getDashboardHTML } from './dashboard.js';
import { authMiddleware } from '../middleware/auth.js';
import ExcelJS from 'exceljs';

/**
 * Main request handler - routes requests to appropriate handlers
 */
export async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Dashboard HTML (serve at root)
  if (path === '/' || path === '/dashboard') {
    return new Response(getDashboardHTML(), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
  
  // API routes
  if (path.startsWith('/api')) {
    return apiRoutes(request, path.replace('/api', ''));
  }
  
  // Monitoring API endpoints
  if (path.startsWith('/monitoring')) {
    const endpoint = path.replace('/monitoring', '');

    // Server Health — public, no auth needed
    if (endpoint === '/health') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          uptimeFormatted: formatUptime(process.uptime()),
          memory: process.memoryUsage(),
          nodeVersion: process.version,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // All remaining monitoring endpoints require authentication (RISK_ASSESSMENT role only)
    const monitoringAuthError = await authMiddleware(request);
    if (monitoringAuthError) return monitoringAuthError;

    if (request.user?.userRole !== 'RISK_ASSESSMENT') {
      return new Response(
        JSON.stringify({ error: 'Access denied. Monitoring requires RISK_ASSESSMENT role.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Current Sessions
    if (endpoint === '/sessions') {
      const currentSessions = getCurrentSessions();
      return new Response(
        JSON.stringify(currentSessions),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Detection Bot
    if (endpoint === '/detection') {
      const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit'), 10) : 100;
      const detection = getDetectionHistory(limit);
      return new Response(
        JSON.stringify(detection),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Log History
    if (endpoint === '/logs') {
      const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit'), 10) : 100;
      const method = url.searchParams.get('method') || null;
      const status = url.searchParams.get('status') ? parseInt(url.searchParams.get('status'), 10) : null;
      const pathFilter = url.searchParams.get('path') || null;
      const ipFilter = url.searchParams.get('ip') || null;
      
      const logs = getLogs({ limit, method, status, path: pathFilter, ip: ipFilter });
      return new Response(
        JSON.stringify(logs),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Log Control
    if (endpoint === '/logs/control') {
      const action = url.searchParams.get('action');
      
      if (action === 'pause') {
        const result = pauseLogging();
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      if (action === 'start') {
        const result = startLogging();
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      if (action === 'clear') {
        const result = clearLogs();
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      if (action === 'status') {
        const result = getLoggingStatus();
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use: pause, start, clear, or status' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Export Logs to CSV
    if (endpoint === '/logs/export/csv') {
      const method = url.searchParams.get('method') || null;
      const status = url.searchParams.get('status') ? parseInt(url.searchParams.get('status'), 10) : null;
      const pathFilter = url.searchParams.get('path') || null;
      const ipFilter = url.searchParams.get('ip') || null;
      
      const csvContent = exportLogsToCSV({ method, status, path: pathFilter, ip: ipFilter });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `request-logs-${timestamp}.csv`;
      
      return new Response(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }
    
    // Export Logs to XLSX
    if (endpoint === '/logs/export/xlsx') {
      const method = url.searchParams.get('method') || null;
      const status = url.searchParams.get('status') ? parseInt(url.searchParams.get('status'), 10) : null;
      const pathFilter = url.searchParams.get('path') || null;
      const ipFilter = url.searchParams.get('ip') || null;
      
      const data = exportLogsToXLSX({ method, status, path: pathFilter, ip: ipFilter });
      
      // Create workbook using ExcelJS
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Request Logs');
      
      // Add headers
      worksheet.addRow(data.headers);
      
      // Style header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      
      // Add data rows
      data.rows.forEach(row => {
        worksheet.addRow(row);
      });
      
      // Set column widths
      worksheet.columns = [
        { width: 20 }, // Timestamp
        { width: 8 },  // Method
        { width: 30 }, // Path
        { width: 8 },  // Status
        { width: 15 }, // IP Address
        { width: 10 }, // User ID
        { width: 25 }, // User Email
        { width: 40 }, // User Agent
        { width: 12 }, // Response Time
        { width: 20 }  // Content Type
      ];
      
      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `request-logs-${timestamp}.xlsx`;
      
      return new Response(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }
  }
  
  // Health check endpoint (for API clients)
  if (path === '/health') {
    try {
      // Quick database connectivity check
      const { prisma } = await import('../lib/prisma.js');
      await prisma.$queryRaw`SELECT 1`;
      
      return new Response(
        JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          database: 'connected',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      // Database connection failed
      return new Response(
        JSON.stringify({
          status: 'degraded',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          database: 'disconnected',
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }
  
  // 404 for unknown routes
  return new Response(
    JSON.stringify({ error: 'Not Found', path }),
    {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Format uptime to human readable string
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

