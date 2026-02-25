import axios from 'axios';
import type { LoginResponse, RegisterResponse, ProfileResponse } from '../types/api';

const API_URL = import.meta.env.VITE_API_URL;

const apiService = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// request untuk melampirkan token jika route dilindungi (protected)
apiService.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (email: string, kataSandi: string) => {
    return apiService.post<LoginResponse>('/users/login', { email, password: kataSandi });
  },
  register: async (namaPengguna: string, email: string, kataSandi: string) => {
    return apiService.post<RegisterResponse>('/users/register', { name: namaPengguna, email, password: kataSandi });
  },
  getProfile: async () => {
    return apiService.get<ProfileResponse>('/users/profile');
  }
};

export default apiService;
