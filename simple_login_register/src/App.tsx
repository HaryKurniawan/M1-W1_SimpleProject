import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import { AuthProvider, useAuth } from './context/AuthContext';

/**
 * =============================================================
 * [OWASP A01 - Broken Access Control]
 * 
 * PENTING: Pembatasan akses di frontend (menyembunyikan halaman,
 * redirect ke login, dsb) hanyalah untuk PENGALAMAN PENGGUNA (UX).
 * 
 * Keamanan sesungguhnya HARUS divalidasi di BACKEND.
 * Frontend berjalan di browser pengguna, sehingga kode bisa
 * dilihat, dimodifikasi, atau dilewati sepenuhnya oleh attacker.
 * 
 * Contoh: Meskipun ProtectedRoute meng-redirect ke /login,
 * attacker tetap bisa mengirim request langsung ke API endpoint
 * menggunakan Postman atau curl. Oleh karena itu, backend
 * selalu memverifikasi token di setiap request.
 * =============================================================
 */

/**
 * [OWASP A01 - Broken Access Control]
 * 
 * ProtectedRoute hanya berfungsi sebagai UX guard.
 * Keamanan sesungguhnya ada di backend middleware (verifyToken).
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 text-gray-500 text-lg font-medium">
        Memeriksa sesi...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
