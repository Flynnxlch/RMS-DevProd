/**
 * Dashboard HTML for server monitoring
 * Accessible at http://localhost:3001/
 */

export function getDashboardHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MinLT Server Monitor</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.css" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
      color: #333;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
    }
    
    .header {
      background: white;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }
    
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      color: #1a202c;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .header h1 i {
      color: #667eea;
    }
    
    .refresh-btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }
    
    .refresh-btn:hover {
      background: #5568d3;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
    }
    
    .refresh-btn:active {
      transform: translateY(0);
    }
    
    .refresh-btn i {
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    .refresh-btn.paused i {
      animation: none;
    }
    
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
      margin-bottom: 24px;
    }
    
    .card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #e2e8f0;
    }
    
    .card-title {
      font-size: 18px;
      font-weight: 600;
      color: #1a202c;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .card-title i {
      font-size: 20px;
    }
    
    .status-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .status-ok {
      background: #c6f6d5;
      color: #22543d;
    }
    
    .status-warning {
      background: #feebc8;
      color: #7c2d12;
    }
    
    .status-error {
      background: #fed7d7;
      color: #742a2a;
    }
    
    .status-paused {
      background: #e2e8f0;
      color: #4a5568;
    }
    
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-top: 16px;
    }
    
    .stat-item {
      text-align: center;
      padding: 12px;
      background: #f7fafc;
      border-radius: 8px;
    }
    
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #667eea;
      margin-bottom: 4px;
    }
    
    .stat-label {
      font-size: 12px;
      color: #718096;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .table-container {
      overflow-x: auto;
      margin-top: 16px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
    }
    
    th {
      background: #f7fafc;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      color: #718096;
      border-bottom: 2px solid #e2e8f0;
    }
    
    td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
    }
    
    tr:hover {
      background: #f7fafc;
    }
    
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }
    
    .badge-success {
      background: #c6f6d5;
      color: #22543d;
    }
    
    .badge-warning {
      background: #feebc8;
      color: #7c2d12;
    }
    
    .badge-danger {
      background: #fed7d7;
      color: #742a2a;
    }
    
    .badge-info {
      background: #bee3f8;
      color: #2c5282;
    }
    
    .log-controls {
      display: flex;
      gap: 8px;
      margin-top: 16px;
      flex-wrap: wrap;
    }
    
    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .btn-primary {
      background: #667eea;
      color: white;
    }
    
    .btn-primary:hover {
      background: #5568d3;
    }
    
    .btn-success {
      background: #48bb78;
      color: white;
    }
    
    .btn-success:hover {
      background: #38a169;
    }
    
    .btn-danger {
      background: #e53e3e;
      color: white;
    }
    
    .btn-danger:hover {
      background: #c53030;
    }
    
    .btn-secondary {
      background: #718096;
      color: white;
    }
    
    .btn-secondary:hover {
      background: #4a5568;
    }
    
    .empty-state {
      text-align: center;
      padding: 40px;
      color: #a0aec0;
    }
    
    .empty-state i {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }
    
    .loading {
      text-align: center;
      padding: 40px;
      color: #667eea;
    }
    
    .loading i {
      animation: spin 1s linear infinite;
      font-size: 32px;
    }
    
    .timestamp {
      font-size: 12px;
      color: #a0aec0;
      font-family: monospace;
    }
    
    .ip-address {
      font-family: monospace;
      font-size: 13px;
      color: #4a5568;
    }
    
    .user-agent {
      font-size: 12px;
      color: #718096;
      word-break: break-word;
      max-width: 500px;
    }
    
    .full-width {
      grid-column: 1 / -1;
    }
    
    @media (max-width: 768px) {
      .grid {
        grid-template-columns: 1fr;
      }
      
      .header {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .stat-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>
        <i class="bi bi-server"></i>
        MinLT Server Monitor
      </h1>
      <button class="refresh-btn" id="refreshBtn" onclick="refreshAll()">
        <i class="bi bi-arrow-clockwise"></i>
        Refresh
      </button>
    </div>
    
    <div class="grid">
      <!-- Server Health Card -->
      <div class="card full-width">
        <div class="card-header">
          <div class="card-title">
            <i class="bi bi-heart-pulse"></i>
            Server Health
          </div>
          <span class="status-badge status-ok" id="healthStatus">OK</span>
        </div>
        <div id="healthContent">
          <div class="loading">
            <i class="bi bi-arrow-clockwise"></i>
            <div>Loading...</div>
          </div>
        </div>
      </div>
      
      <!-- Detection Bot Card -->
      <div class="card full-width">
        <div class="card-header">
          <div class="card-title">
            <i class="bi bi-shield-exclamation"></i>
            Bot Detection
          </div>
          <span class="status-badge status-warning" id="detectionCount">0</span>
        </div>
        <div id="detectionContent">
          <div class="loading">
            <i class="bi bi-arrow-clockwise"></i>
            <div>Loading...</div>
          </div>
        </div>
      </div>
      
      <!-- Current Sessions Card -->
      <div class="card full-width">
        <div class="card-header">
          <div class="card-title">
            <i class="bi bi-people"></i>
            Current Sessions
          </div>
          <span class="status-badge status-info" id="sessionsCount">0</span>
        </div>
        <div id="sessionsContent">
          <div class="loading">
            <i class="bi bi-arrow-clockwise"></i>
            <div>Loading...</div>
          </div>
        </div>
      </div>
      
      <!-- Log History Card -->
      <div class="card full-width">
        <div class="card-header">
          <div class="card-title">
            <i class="bi bi-list-ul"></i>
            Request Logs
          </div>
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <span class="status-badge" id="logStatus">Active</span>
            <div class="log-controls" style="margin-top: 0;">
              <button class="btn btn-success" onclick="exportLogs('csv')">
                <i class="bi bi-file-earmark-spreadsheet"></i>
                Export CSV
              </button>
              <button class="btn btn-success" onclick="exportLogs('xlsx')">
                <i class="bi bi-file-earmark-excel"></i>
                Export XLSX
              </button>
              <button class="btn btn-secondary" id="pauseLogBtn" onclick="toggleLogging()">
                <i class="bi bi-pause-fill"></i>
                Pause
              </button>
              <button class="btn btn-danger" onclick="clearLogs()">
                <i class="bi bi-trash"></i>
                Clear
              </button>
            </div>
          </div>
        </div>
        <div id="logsContent">
          <div class="loading">
            <i class="bi bi-arrow-clockwise"></i>
            <div>Loading...</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <script>
    let isLoggingPaused = false;
    let autoRefreshInterval = null;
    
    // Format timestamp
    function formatTime(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }
    
    // Format uptime
    function formatUptime(seconds) {
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      
      if (days > 0) return \`\${days}d \${hours}h \${minutes}m\`;
      if (hours > 0) return \`\${hours}h \${minutes}m\`;
      if (minutes > 0) return \`\${minutes}m \${secs}s\`;
      return \`\${secs}s\`;
    }
    
    // Format bytes
    function formatBytes(bytes) {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
    
    // Load Server Health
    async function loadHealth() {
      try {
        const response = await fetch('/monitoring/health');
        const data = await response.json();
        
        const html = \`
          <div class="stat-grid">
            <div class="stat-item">
              <div class="stat-value">\${data.status === 'ok' ? '✓' : '✗'}</div>
              <div class="stat-label">Status</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">\${formatUptime(data.uptime)}</div>
              <div class="stat-label">Uptime</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">\${formatBytes(data.memory.heapUsed)}</div>
              <div class="stat-label">Heap Used</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">\${formatBytes(data.memory.heapTotal)}</div>
              <div class="stat-label">Heap Total</div>
            </div>
          </div>
        \`;
        
        document.getElementById('healthContent').innerHTML = html;
        document.getElementById('healthStatus').textContent = data.status.toUpperCase();
        document.getElementById('healthStatus').className = \`status-badge status-\${data.status === 'ok' ? 'ok' : 'error'}\`;
      } catch (error) {
        document.getElementById('healthContent').innerHTML = \`
          <div class="empty-state">
            <i class="bi bi-exclamation-triangle"></i>
            <div>Error loading health data</div>
          </div>
        \`;
      }
    }
    
    // Load Current Sessions
    async function loadSessions() {
      try {
        const response = await fetch('/monitoring/sessions');
        const data = await response.json();
        
        document.getElementById('sessionsCount').textContent = data.totalActiveSessions;
        
        if (data.sessions.length === 0) {
          document.getElementById('sessionsContent').innerHTML = \`
            <div class="empty-state">
              <i class="bi bi-person-x"></i>
              <div>No active sessions</div>
            </div>
          \`;
          return;
        }
        
        const html = \`
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>IP Address</th>
                  <th>Device</th>
                  <th>Last Activity</th>
                </tr>
              </thead>
              <tbody>
                \${data.sessions.map(session => \`
                  <tr>
                    <td>\${session.userName || 'N/A'}</td>
                    <td>\${session.userEmail || 'N/A'}</td>
                    <td><span class="ip-address">\${session.deviceInfo?.ip || 'unknown'}</span></td>
                    <td><span class="user-agent" title="\${session.deviceInfo?.userAgent || 'unknown'}">\${(session.deviceInfo?.userAgent || 'unknown').substring(0, 50)}...</span></td>
                    <td><span class="timestamp">\${formatTime(session.lastActivity)}</span></td>
                  </tr>
                \`).join('')}
              </tbody>
            </table>
          </div>
          <div style="margin-top: 12px; font-size: 12px; color: #718096; text-align: center;">
            Total: \${data.totalActiveSessions} sessions from \${data.totalActiveUsers} users
          </div>
        \`;
        
        document.getElementById('sessionsContent').innerHTML = html;
      } catch (error) {
        document.getElementById('sessionsContent').innerHTML = \`
          <div class="empty-state">
            <i class="bi bi-exclamation-triangle"></i>
            <div>Error loading sessions</div>
          </div>
        \`;
      }
    }
    
    // Load Detection Bot
    async function loadDetection() {
      try {
        const response = await fetch('/monitoring/detection?limit=50');
        const data = await response.json();
        
        const totalDetections = data.summary.rateLimitExceeded + data.summary.botDetected;
        document.getElementById('detectionCount').textContent = totalDetections;
        
        if (data.recentDetections.length === 0) {
          document.getElementById('detectionContent').innerHTML = \`
            <div class="empty-state">
              <i class="bi bi-shield-check"></i>
              <div>No threats detected</div>
            </div>
          \`;
          return;
        }
        
        const html = \`
          <div class="stat-grid">
            <div class="stat-item">
              <div class="stat-value">\${data.summary.rateLimitExceeded}</div>
              <div class="stat-label">Rate Limit</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">\${data.summary.botDetected}</div>
              <div class="stat-label">Bot Detected</div>
            </div>
          </div>
          <div class="table-container" style="margin-top: 16px; max-height: 300px; overflow-y: auto;">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>IP/Client</th>
                  <th>Path</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                \${data.recentDetections.slice(0, 10).map(detection => \`
                  <tr>
                    <td>
                      <span class="badge \${detection.type === 'rate_limit_exceeded' ? 'badge-warning' : 'badge-danger'}">
                        \${detection.type === 'rate_limit_exceeded' ? 'Rate Limit' : 'Bot'}
                      </span>
                    </td>
                    <td><span class="ip-address">\${detection.clientId || detection.ip || 'unknown'}</span></td>
                    <td>\${detection.path || 'N/A'}</td>
                    <td><span class="timestamp">\${formatTime(detection.timestamp)}</span></td>
                  </tr>
                \`).join('')}
              </tbody>
            </table>
          </div>
        \`;
        
        document.getElementById('detectionContent').innerHTML = html;
      } catch (error) {
        document.getElementById('detectionContent').innerHTML = \`
          <div class="empty-state">
            <i class="bi bi-exclamation-triangle"></i>
            <div>Error loading detection data</div>
          </div>
        \`;
      }
    }
    
    // Load Logs
    async function loadLogs() {
      try {
        const response = await fetch('/monitoring/logs?limit=100');
        const data = await response.json();
        
        // Update log status
        const statusBadge = document.getElementById('logStatus');
        statusBadge.textContent = data.isLoggingEnabled ? 'Active' : 'Paused';
        statusBadge.className = \`status-badge status-\${data.isLoggingEnabled ? 'ok' : 'paused'}\`;
        
        if (data.logs.length === 0) {
          document.getElementById('logsContent').innerHTML = \`
            <div class="empty-state">
              <i class="bi bi-inbox"></i>
              <div>No logs available</div>
            </div>
          \`;
          return;
        }
        
        const html = \`
          <div class="table-container" style="max-height: 500px; overflow-y: auto;">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Method</th>
                  <th>Path</th>
                  <th>Status</th>
                  <th>IP Address</th>
                  <th>User</th>
                  <th>Response Time</th>
                </tr>
              </thead>
              <tbody>
                \${data.logs.map(log => \`
                  <tr>
                    <td><span class="timestamp">\${formatTime(log.timestamp)}</span></td>
                    <td><span class="badge badge-info">\${log.method}</span></td>
                    <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="\${log.path}">\${log.path}</td>
                    <td>
                      <span class="badge \${log.status >= 200 && log.status < 300 ? 'badge-success' : log.status >= 400 ? 'badge-danger' : 'badge-warning'}">
                        \${log.status}
                      </span>
                    </td>
                    <td><span class="ip-address">\${log.ip}</span></td>
                    <td>\${log.userEmail || log.userId || '-'}</td>
                    <td>\${log.responseTime || '-'}</td>
                  </tr>
                \`).join('')}
              </tbody>
            </table>
          </div>
        \`;
        
        document.getElementById('logsContent').innerHTML = html;
      } catch (error) {
        document.getElementById('logsContent').innerHTML = \`
          <div class="empty-state">
            <i class="bi bi-exclamation-triangle"></i>
            <div>Error loading logs</div>
          </div>
        \`;
      }
    }
    
    // Export Logs
    async function exportLogs(format) {
      try {
        const url = \`/monitoring/logs/export/\${format}\`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Export failed');
        }
        
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || \`request-logs.\${format}\`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
      } catch (error) {
        alert('Error exporting logs: ' + error.message);
      }
    }
    
    // Toggle Logging
    async function toggleLogging() {
      try {
        const action = isLoggingPaused ? 'start' : 'pause';
        const response = await fetch(\`/monitoring/logs/control?action=\${action}\`);
        const data = await response.json();
        
        isLoggingPaused = !data.isLoggingEnabled;
        const btn = document.getElementById('pauseLogBtn');
        btn.innerHTML = isLoggingPaused 
          ? '<i class="bi bi-play-fill"></i> Start'
          : '<i class="bi bi-pause-fill"></i> Pause';
        btn.className = \`btn \${isLoggingPaused ? 'btn-primary' : 'btn-secondary'}\`;
        
        loadLogs();
      } catch (error) {
        alert('Error toggling logging: ' + error.message);
      }
    }
    
    // Clear Logs
    async function clearLogs() {
      if (!confirm('Are you sure you want to clear all logs?')) {
        return;
      }
      
      try {
        const response = await fetch('/monitoring/logs/control?action=clear');
        const data = await response.json();
        loadLogs();
      } catch (error) {
        alert('Error clearing logs: ' + error.message);
      }
    }
    
    // Refresh All
    async function refreshAll() {
      const btn = document.getElementById('refreshBtn');
      btn.disabled = true;
      btn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Refreshing...';
      
      await Promise.all([
        loadHealth(),
        loadSessions(),
        loadDetection(),
        loadLogs()
      ]);
      
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Refresh';
    }
    
    // Auto refresh every 5 seconds
    function startAutoRefresh() {
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
      }
      autoRefreshInterval = setInterval(refreshAll, 5000);
    }
    
    // Initial load
    refreshAll();
    startAutoRefresh();
    
    // Check log status on load
    fetch('/monitoring/logs/control?action=status')
      .then(res => res.json())
      .then(data => {
        isLoggingPaused = !data.isLoggingEnabled;
        const btn = document.getElementById('pauseLogBtn');
        btn.innerHTML = isLoggingPaused 
          ? '<i class="bi bi-play-fill"></i> Start'
          : '<i class="bi bi-pause-fill"></i> Pause';
        btn.className = \`btn \${isLoggingPaused ? 'btn-primary' : 'btn-secondary'}\`;
      });
  </script>
</body>
</html>`;
}
