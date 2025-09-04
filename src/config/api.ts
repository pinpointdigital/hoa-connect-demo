// API Configuration
// This file centralizes API endpoint configuration for the HOA Connect demo

export const API_CONFIG = {
  // Base API URL - uses environment variable or falls back to localhost for development
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  
  // API endpoints
  ENDPOINTS: {
    HEALTH: '/health',
    NOTIFICATIONS: '/api/notifications',
    REQUESTS: '/api/requests',
    USERS: '/api/users',
    COMMUNITIES: '/api/communities'
  },
  
  // Environment checks
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  
  // Socket.IO configuration
  SOCKET_CONFIG: {
    transports: ['websocket', 'polling'],
    timeout: 5000,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string = '') => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to log configuration (for debugging)
export const logApiConfig = () => {
  if (!API_CONFIG.IS_PRODUCTION) {
    console.log('🔧 API Configuration:', {
      baseUrl: API_CONFIG.BASE_URL,
      environment: process.env.NODE_ENV,
      isProduction: API_CONFIG.IS_PRODUCTION
    });
  }
};
