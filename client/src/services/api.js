import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Bearer token and current phase
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Automatically attach the current phase from the URL to all API calls
    const urlParams = new URLSearchParams(window.location.search);
    const phase = urlParams.get('phase') || '2';
    
    if (config.method === 'get' || config.method === 'delete') {
      config.params = { ...config.params, phase };
    } else {
      // For POST/PUT requests, you might want to pass it as a query param too
      // so the middleware handles it correctly
      config.url = config.url.includes('?') 
        ? `${config.url}&phase=${phase}` 
        : `${config.url}?phase=${phase}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
