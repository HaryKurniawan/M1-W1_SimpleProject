import React, { useState, useEffect, createContext, useContext } from 'react';
import { authAPI } from '../services/api';

/**
 * =============================================================
 * [OWASP A04 - Cryptographic Failures]
 * 
 * Auth context menggunakan pendekatan cookie-based.
 * Kita TIDAK lagi mengecek localStorage untuk token karena:
 * 1. Token sekarang disimpan di HttpOnly cookie (tidak bisa diakses JS)
 * 2. Untuk mengecek apakah user sudah login, kita melakukan
 *    request ke /profile — jika berhasil, berarti cookie valid.
 * 
 * SEBELUMNYA (TIDAK AMAN):
 * const token = localStorage.getItem('authToken');
 * if (!token) redirect('/login');
 * → Token bisa dicuri via XSS ❌
 * 
 * SEKARANG (AMAN):
 * Cek autentikasi via API call yang mengirim HttpOnly cookie.
 * → Token tidak bisa diakses oleh JavaScript ✅
 * =============================================================
 */

// Context untuk state autentikasi
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  setIsAuthenticated: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  setIsAuthenticated: () => {},
});

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

// Provider autentikasi
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    /**
     * [A04] Cek autentikasi dengan memanggil API profile.
     * Jika cookie valid, berarti user sudah login.
     * Jika gagal (401/403), berarti belum login atau session expired.
     */
    const checkAuth = async () => {
      try {
        await authAPI.getProfile();
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, setIsAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
