/**
 * Request logging middleware
 * Logs all requests with IP address, method, path, status, etc.
 * Supports pause/start functionality
 */

// Log storage
const requestLogs = [];
const MAX_LOG_ENTRIES = 5000; // Keep last 5000 log entries

// Logging state
let isLoggingEnabled = true;

/**
 * Get client IP address from request
 */
export function getClientIP(request) {
  const forwarded = request.headers.get('X-Forwarded-For');
  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('X-Real-IP');
  if (realIP) {
    return realIP;
  }
  
  // Fallback (for local development)
  return '127.0.0.1';
}

/**
 * Add log entry
 */
export function addLogEntry(entry) {
  if (!isLoggingEnabled) {
    return;
  }
  
  const logEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
    id: Date.now() + Math.random(), // Unique ID
  };
  
  requestLogs.push(logEntry);
  
  // Keep only last MAX_LOG_ENTRIES
  if (requestLogs.length > MAX_LOG_ENTRIES) {
    requestLogs.shift();
  }
}

/**
 * Log request
 */
export function logRequest(request, response, responseTime = null) {
  if (!isLoggingEnabled) {
    return;
  }
  
  const url = new URL(request.url);
  const ip = getClientIP(request);
  const userAgent = request.headers.get('User-Agent') || 'unknown';
  const method = request.method;
  const path = url.pathname;
  const status = response?.status || 0;
  const contentType = response?.headers?.get('Content-Type') || 'unknown';
  
  // Try to get user info from token if available
  let userId = null;
  let userEmail = null;
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.replace('Bearer ', '');
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        userId = payload.userId || payload.id || null;
        userEmail = payload.email || null;
      }
    } catch {
      // Ignore token decode errors
    }
  }
  
  addLogEntry({
    method,
    path,
    fullUrl: request.url,
    status,
    ip,
    userAgent,
    userId,
    userEmail,
    contentType,
    responseTime: responseTime ? `${responseTime}ms` : null,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Get logs
 */
export function getLogs(options = {}) {
  const {
    limit = 100,
    startDate = null,
    endDate = null,
    method = null,
    status = null,
    path = null,
    ip = null,
    userId = null,
  } = options;
  
  let filteredLogs = [...requestLogs];
  
  // Filter by date range
  if (startDate) {
    const start = new Date(startDate);
    filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= start);
  }
  
  if (endDate) {
    const end = new Date(endDate);
    filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= end);
  }
  
  // Filter by method
  if (method) {
    filteredLogs = filteredLogs.filter(log => log.method === method);
  }
  
  // Filter by status
  if (status) {
    filteredLogs = filteredLogs.filter(log => log.status === status);
  }
  
  // Filter by path
  if (path) {
    filteredLogs = filteredLogs.filter(log => log.path.includes(path));
  }
  
  // Filter by IP
  if (ip) {
    filteredLogs = filteredLogs.filter(log => log.ip === ip);
  }
  
  // Filter by userId
  if (userId) {
    filteredLogs = filteredLogs.filter(log => log.userId === userId);
  }
  
  // Sort by timestamp (newest first) and limit
  filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const limitedLogs = filteredLogs.slice(0, limit);
  
  // Calculate statistics
  const stats = {
    total: requestLogs.length,
    filtered: filteredLogs.length,
    returned: limitedLogs.length,
    byMethod: {},
    byStatus: {},
    byPath: {},
    topIPs: {},
    topUsers: {},
  };
  
  // Calculate stats from all logs (not filtered)
  requestLogs.forEach(log => {
    // By method
    stats.byMethod[log.method] = (stats.byMethod[log.method] || 0) + 1;
    
    // By status
    const statusGroup = Math.floor(log.status / 100) * 100; // 200, 300, 400, 500
    stats.byStatus[statusGroup] = (stats.byStatus[statusGroup] || 0) + 1;
    
    // By path (top 10)
    const pathBase = log.path.split('?')[0]; // Remove query params
    stats.byPath[pathBase] = (stats.byPath[pathBase] || 0) + 1;
    
    // Top IPs
    stats.topIPs[log.ip] = (stats.topIPs[log.ip] || 0) + 1;
    
    // Top users
    if (log.userId) {
      stats.topUsers[log.userId] = (stats.topUsers[log.userId] || 0) + 1;
    }
  });
  
  // Sort top items
  stats.topPaths = Object.entries(stats.byPath)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, count]) => ({ path, count }));
  
  stats.topIPs = Object.entries(stats.topIPs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([ip, count]) => ({ ip, count }));
  
  stats.topUsers = Object.entries(stats.topUsers)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([userId, count]) => ({ userId, count }));
  
  return {
    logs: limitedLogs,
    stats,
    isLoggingEnabled,
    totalEntries: requestLogs.length,
  };
}

/**
 * Clear logs
 */
export function clearLogs() {
  requestLogs.length = 0;
  return { message: 'Logs cleared successfully' };
}

/**
 * Pause logging
 */
export function pauseLogging() {
  isLoggingEnabled = false;
  return { message: 'Logging paused', isLoggingEnabled: false };
}

/**
 * Start/resume logging
 */
export function startLogging() {
  isLoggingEnabled = true;
  return { message: 'Logging started', isLoggingEnabled: true };
}

/**
 * Get logging status
 */
export function getLoggingStatus() {
  return {
    isLoggingEnabled,
    totalEntries: requestLogs.length,
    maxEntries: MAX_LOG_ENTRIES,
  };
}

/**
 * Export logs to CSV format
 */
export function exportLogsToCSV(options = {}) {
  const logs = getLogs({ ...options, limit: 10000 }); // Get all logs (up to 10000)
  
  // CSV Headers
  const headers = [
    'Timestamp',
    'Method',
    'Path',
    'Status',
    'IP Address',
    'User ID',
    'User Email',
    'User Agent',
    'Response Time',
    'Content Type'
  ];
  
  // CSV Rows
  const rows = logs.logs.map(log => [
    log.timestamp || '',
    log.method || '',
    log.path || '',
    log.status || '',
    log.ip || '',
    log.userId || '',
    log.userEmail || '',
    (log.userAgent || '').replace(/"/g, '""'), // Escape quotes
    log.responseTime || '',
    log.contentType || ''
  ]);
  
  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  // Add BOM for Excel compatibility
  return '\uFEFF' + csvContent;
}

/**
 * Export logs to XLSX format (returns JSON structure for xlsx library)
 */
export function exportLogsToXLSX(options = {}) {
  const logs = getLogs({ ...options, limit: 10000 }); // Get all logs (up to 10000)
  
  // Headers
  const headers = [
    'Timestamp',
    'Method',
    'Path',
    'Status',
    'IP Address',
    'User ID',
    'User Email',
    'User Agent',
    'Response Time',
    'Content Type'
  ];
  
  // Data rows
  const rows = logs.logs.map(log => [
    log.timestamp || '',
    log.method || '',
    log.path || '',
    log.status || '',
    log.ip || '',
    log.userId || '',
    log.userEmail || '',
    log.userAgent || '',
    log.responseTime || '',
    log.contentType || ''
  ]);
  
  return {
    headers,
    rows,
    totalRows: rows.length
  };
}
