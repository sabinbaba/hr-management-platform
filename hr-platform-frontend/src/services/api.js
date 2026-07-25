import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let onSessionExpired = null;

export function registerSessionExpiredHandler(handler) {
  onSessionExpired = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthError = error.response?.status === 401;
    const isLoginRequest = error.config?.url?.includes('/auth/login');

    if (isAuthError && !isLoginRequest && onSessionExpired) {
      onSessionExpired();
    }

    return Promise.reject(error);
  }
);

export default api;
