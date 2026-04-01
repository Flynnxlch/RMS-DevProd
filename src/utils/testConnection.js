import { API_ENDPOINTS } from '../config/api';

/**
 * Test backend connection
 */
export async function testBackendConnection() {
  try {
    const response = await fetch(`${API_ENDPOINTS.auth.login}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'test@test.com', password: 'test' }),
    });

    // If we get a response (even 401), the backend is connected
    if (response.status === 401 || response.status === 400) {
      return { connected: true, message: 'Backend is connected' };
    }

    const data = await response.json();
    return { connected: true, message: 'Backend is connected', data };
  } catch (error) {
    if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
      return { 
        connected: false, 
        message: 'Backend is not running. Please start the backend server.' 
      };
    }
    return { connected: false, message: error.message };
  }
}
