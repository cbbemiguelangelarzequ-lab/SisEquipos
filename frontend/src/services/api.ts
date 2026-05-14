import axios from 'axios';

// Create Axios instance with default config
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor for API calls
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    // Si el responseType era 'blob' y el servidor devuelvió un error,
    // el body será un Blob ilegible — lo convertimos a texto/JSON para poder leerlo.
    if (error.response?.data instanceof Blob && error.response.data.type !== 'application/pdf') {
      try {
        const text = await error.response.data.text();
        try {
          error.response.data = JSON.parse(text);
        } catch {
          error.response.data = { message: text };
        }
      } catch (_) { /* dejar como está si falla */ }
    }
    if (error.response?.status === 401 && !originalRequest._retry) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    } else {
      console.error('API ERROR:', originalRequest?.url, error.message, error.response?.status, error.response?.data);
    }
    return Promise.reject(error);
  }
);
