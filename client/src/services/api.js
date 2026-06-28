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

  // Derive the server root (no trailing slash).
  // When VITE_API_URL is a relative path like "/api", baseUrl has no domain.
  // In that case use window.location.origin so that localhost URLs stored in
  // the database are rewritten to the actual live domain automatically.
  let rootUrl;
  if (baseUrl.startsWith('http')) {
    // Absolute URL — strip the /api suffix to get the server root
    rootUrl = baseUrl.endsWith('/api')
      ? baseUrl.slice(0, -4)
      : baseUrl.split('/api')[0];
  } else {
    // Relative URL (e.g. "/api") — use the browser's current origin at runtime
    rootUrl = typeof window !== 'undefined' ? window.location.origin : '';
  }

  // Relative paths: prepend server root
  if (url.startsWith('/') || url.startsWith('uploads/') || url.startsWith('uploads\\')) {
    const cleanUrl = url.startsWith('/') ? url : `/${url.replace(/\\/g, '/')}`;
    return `${rootUrl}${cleanUrl}`;
  }

  // Absolute localhost URLs stored in DB: replace host with real server root
  // e.g. "http://localhost:5000/uploads/foo.jpg" → "https://yourapp.onrender.com/uploads/foo.jpg"
  if (/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(url)) {
    return url.replace(/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/g, rootUrl);
  }

  return url;
};

export const resolveDriveVideoUrl = (fileId) => {
  if (!fileId) return '';
  let rootUrl;
  if (baseUrl.startsWith('http')) {
    rootUrl = baseUrl.endsWith('/api')
      ? baseUrl.slice(0, -4)
      : baseUrl.split('/api')[0];
  } else {
    rootUrl = typeof window !== 'undefined' ? window.location.origin : '';
  }
  return `${rootUrl}/api/drive/${fileId}`;
};

export default API;
