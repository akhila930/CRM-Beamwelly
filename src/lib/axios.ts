import axios from 'axios';
import { getApiBaseUrl } from './runtimeConfig';

const api = axios.create({
  baseURL: getApiBaseUrl(),
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

// Smart Request Cache & Deduplication Layer
const getCache = new Map<string, { promise: Promise<any>; timestamp: number }>();
const CACHE_TTL = 3000; // 3 seconds TTL

const originalGet = api.get;
api.get = function (url: string, config?: any) {
  // Bypass cache for blobs (downloads)
  if (config?.responseType === 'blob') {
    return originalGet.apply(this, [url, config]);
  }
  
  const cacheKey = JSON.stringify({ url, params: config?.params });
  const cached = getCache.get(cacheKey);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp < CACHE_TTL)) {
    return cached.promise;
  }
  
  const promise = originalGet.apply(this, [url, config]).catch((err) => {
    // If request fails, remove from cache immediately so retries/refresh work
    getCache.delete(cacheKey);
    throw err;
  });
  
  getCache.set(cacheKey, { promise, timestamp: now });
  return promise;
} as any;

// Clear GET cache on any write (POST, PUT, DELETE) to guarantee consistency
const originalPost = api.post;
api.post = function (url: string, data?: any, config?: any) {
  getCache.clear();
  return originalPost.apply(this, [url, data, config]);
} as any;

const originalPut = api.put;
api.put = function (url: string, data?: any, config?: any) {
  getCache.clear();
  return originalPut.apply(this, [url, data, config]);
} as any;

const originalDelete = api.delete;
api.delete = function (url: string, config?: any) {
  getCache.clear();
  return originalDelete.apply(this, [url, config]);
} as any;

export default api;