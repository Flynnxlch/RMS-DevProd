// API Configuration
// In production, use empty string for relative paths (Nginx will proxy)
// In development, automatically uses the same hostname as the frontend
// This works for both localhost and network IP access
const getApiBaseUrl = () => {
  // Check if VITE_API_BASE_URL is explicitly set
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // In production, use relative paths (Nginx will proxy)
  if (import.meta.env.PROD) {
    return '';
  }
  
  // In development, use the same hostname as the frontend
  // This automatically works for both localhost and network IP
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const port = '3001'; // Your backend port
  
  // If accessing via localhost, use localhost for API
  // If accessing via IP, use the same IP for API
  return `http://${hostname}:${port}`;
};

export const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/api/auth/login`,
    register: `${API_BASE_URL}/api/auth/register`,
    me: `${API_BASE_URL}/api/auth/me`,
  },
  users: {
    getAll: `${API_BASE_URL}/api/users`,
    update: (id) => `${API_BASE_URL}/api/users/${id}`,
    delete: (id) => `${API_BASE_URL}/api/users/${id}`,
  },
  risks: {
    getAll: `${API_BASE_URL}/api/risks`,
    getById: (id) => `${API_BASE_URL}/api/risks/${id}`,
    create: `${API_BASE_URL}/api/risks`,
    update: (id) => `${API_BASE_URL}/api/risks/${id}`,
    delete: (id) => `${API_BASE_URL}/api/risks/${id}`,
    analysis: (id) => `${API_BASE_URL}/api/risks/${id}/analysis`,
    mitigation: (id) => `${API_BASE_URL}/api/risks/${id}/mitigation`,
    evaluation: (id) => `${API_BASE_URL}/api/risks/${id}/evaluations`,
  },
  requests: {
    registration: {
      getAll: `${API_BASE_URL}/api/user-requests/registration`,
      approve: (id) => `${API_BASE_URL}/api/user-requests/registration/${id}/approve`,
      reject: (id) => `${API_BASE_URL}/api/user-requests/registration/${id}/reject`,
    },
    other: {
      getAll: `${API_BASE_URL}/api/user-requests/other`,
      create: `${API_BASE_URL}/api/user-requests/other`,
      approve: (id) => `${API_BASE_URL}/api/user-requests/other/${id}/approve`,
      reject: (id) => `${API_BASE_URL}/api/user-requests/other/${id}/reject`,
    },
  },
  regulations: {
    getAll: `${API_BASE_URL}/api/regulation-updates`,
    getById: (id) => `${API_BASE_URL}/api/regulation-updates/${id}`,
    create: `${API_BASE_URL}/api/regulation-updates`,
    update: (id) => `${API_BASE_URL}/api/regulation-updates/${id}`,
    delete: (id) => `${API_BASE_URL}/api/regulation-updates/${id}`,
  },
};

// Helper function to get auth token from localStorage
export const getAuthToken = () => {
  return localStorage.getItem('minlt:auth:token');
};

// Helper function to set auth token
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('minlt:auth:token', token);
  } else {
    localStorage.removeItem('minlt:auth:token');
  }
};

// Helper function for API requests
export const apiRequest = async (url, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    // For GET requests with refresh parameter, ensure no browser cache
    const fetchOptions = {
      ...options,
      headers,
    };
    
    // If URL contains refresh=true, add cache control
    if (url.includes('refresh=true')) {
      fetchOptions.cache = 'no-store';
    }
    
    const response = await fetch(url, fetchOptions);

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return {};
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    // Re-throw if it's already an Error with message
    if (error instanceof Error) {
      throw error;
    }
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to server. Please check if the backend is running.');
    }
    throw error;
  }
};
