import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const axiosClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the JWT (if present) to every outgoing request.
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize error responses so components can just read `error.message`.
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.errors?.[0]?.message ||
      error.message ||
      'Something went wrong. Please try again.';

    // If the token is invalid/expired, clear local session so the
    // ProtectedRoute sends the user back to login on next navigation.
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }

    return Promise.reject({ ...error, message });
  }
);

export default axiosClient;
