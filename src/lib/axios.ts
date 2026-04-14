import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Ensure headers are included in the request
    if (config.method === 'get') {
      config.headers['Cache-Control'] = 'no-cache';
      config.headers['Pragma'] = 'no-cache';
    }
    // Handle blob responses
    if (config.responseType === 'blob') {
      config.headers['Accept'] = 'text/csv';
    }
    // Add CORS headers
    config.headers['Access-Control-Allow-Origin'] = 'http://localhost:8080';
    config.headers['Access-Control-Allow-Credentials'] = 'true';
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // For blob responses, pass through the response
    if (response.config.responseType === 'blob') {
      return response;
    }
    return response;
  },
  (error) => {
    console.error('Response error:', error);
    // Handle blob response errors
    if (error.config?.responseType === 'blob') {
      return Promise.reject(new Error('Failed to download file'));
    }
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    } else if (error.response?.status === 403) {
      // Handle forbidden access
      console.error('Forbidden access:', error.response.data);
    } else if (error.response?.status === 500) {
      // Handle server errors
      console.error('Server error:', error.response.data);
    }
    return Promise.reject(error);
  }
);

export default api;