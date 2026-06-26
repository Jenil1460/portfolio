import axios from 'axios';

let baseUrl = import.meta.env.VITE_API_URL || '/api';

// Auto-correct base URL in production if VITE_API_URL is configured without the /api suffix
if (baseUrl.startsWith('http') && !baseUrl.endsWith('/api') && !baseUrl.includes('/api/')) {
  // Clean trailing slash if present
  baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  baseUrl = `${baseUrl}/api`;
}

const API = axios.create({
  baseURL: baseUrl,
});

// Automatically inject JWT token into header
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercept responses for auth errors (e.g. expired tokens)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login if unauthorized
      localStorage.removeItem('token');
      localStorage.removeItem('admin');
      if (!window.location.pathname.startsWith('/admin/login') && window.location.pathname.includes('/admin')) {
        window.location.href = '/admin/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export const resolveMediaUrl = (url) => {
  if (!url) return '';
  const rootUrl = baseUrl.endsWith('/api') ? baseUrl.slice(0, -4) : (baseUrl.includes('/api/') ? baseUrl.split('/api')[0] : baseUrl);
  
  if (url.startsWith('/')) {
    return `${rootUrl}${url}`;
  }
  
  if (/https?:\/\/(localhost|127\.0\.0\.1):\d+/.test(url)) {
    return url.replace(/https?:\/\/(localhost|127\.0\.0\.1):\d+/g, rootUrl);
  }
  
  return url;
};

export default API;
