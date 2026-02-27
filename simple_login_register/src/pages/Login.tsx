import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { ApiErrorResponse } from '../types/api';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [kataSandi, setKataSandi] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuth();

  const handleMasuk = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    /**
     * =============================================================
     * [OWASP A05 - Injection (XSS)]
     * 
     * Validasi input di frontend SEBELUM mengirim ke server.
     * Meskipun backend juga melakukan validasi, validasi di frontend
     * memberikan feedback lebih cepat kepada user dan mengurangi
     * beban request ke server.
     * 
     * PENTING: Validasi frontend BUKAN pengganti validasi backend.
     * Attacker bisa melewati frontend dan mengirim request langsung.
     * =============================================================
     */
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Format email tidak valid.');
      setLoading(false);
      return;
    }

    if (kataSandi.length < 1) {
      setError('Password tidak boleh kosong.');
      setLoading(false);
      return;
    }

    try {
      await authAPI.login(email, kataSandi);

      /**
       * =============================================================
       * [OWASP A04 - Cryptographic Failures]
       * 
       * SEBELUMNYA (TIDAK AMAN):
       * const token = response.data.token;
       * localStorage.setItem('authToken', token);
       * → Token disimpan di localStorage → bisa dicuri via XSS ❌
       * 
       * SEKARANG (AMAN):
       * Server mengirim token via HttpOnly cookie.
       * Kita hanya perlu update state bahwa user sudah login.
       * Token TIDAK pernah menyentuh JavaScript. ✅
       * =============================================================
       */
      setIsAuthenticated(true);
      navigate('/');
    } catch (err: unknown) {
      /**
       * =============================================================
       * [OWASP A10 - Mishandling Exceptional Conditions]
       * 
       * Tampilkan pesan error yang AMAN dan user-friendly.
       * Jangan pernah menampilkan detail teknis (stack trace,
       * SQL error, dsb) yang bisa membantu attacker.
       * =============================================================
       */
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        setError(axiosError.response?.data?.message || 'Login gagal, periksa email dan kata sandi Anda.');
      } else {
        setError('Login gagal, terjadi kesalahan tidak terduga.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-xl border border-gray-200 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Masuk / Login</h2>
        
        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium text-center">
            {/**
             * [OWASP A05 - Injection (XSS)]
             * 
             * React secara DEFAULT melakukan escaping pada text content.
             * Menggunakan {error} (bukan dangerouslySetInnerHTML)
             * berarti jika error message mengandung <script>alert(1)</script>,
             * React akan menampilkan teks tersebut, BUKAN mengeksekusi script.
             * 
             * YANG BERBAHAYA:
             * <div dangerouslySetInnerHTML={{ __html: error }} /> ❌
             * → Script dalam error message akan dieksekusi!
             * 
             * YANG AMAN (yang kita pakai):
             * <div>{error}</div> ✅
             * → Script ditampilkan sebagai teks biasa
             */}
            {error}
          </div>
        )}
        
        <form onSubmit={handleMasuk} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="login-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="Masukkan email"
              required
              /**
               * [OWASP A05] autocomplete="email" membantu browser
               * mengisi email dengan aman tanpa ekstensi pihak ketiga.
               */
              autoComplete="email"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Kata Sandi (Password)</label>
            <input
              type="password"
              id="login-password"
              value={kataSandi}
              onChange={(e) => setKataSandi(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="Masukkan kata sandi"
              required
              autoComplete="current-password"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
        
        <p className="mt-6 text-center text-sm text-gray-600">
          Belum punya akun?{' '}
          <Link to="/register" className="text-blue-600 font-semibold hover:underline">
            Daftar di sini
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
