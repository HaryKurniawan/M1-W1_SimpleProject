import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import { authAPI } from '../services/api';
import type { ApiErrorResponse } from '../types/api';

const Register: React.FC = () => {
  const [namaPengguna, setNamaPengguna] = useState('');
  const [email, setEmail] = useState('');
  const [kataSandi, setKataSandi] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  /**
   * =============================================================
   * [OWASP A07 - Authentication Failures]
   * 
   * Fungsi untuk menghitung kekuatan password secara visual.
   * Ini membantu user membuat password yang lebih kuat.
   * 
   * PENTING: Ini hanya feedback UX. Validasi sesungguhnya
   * dilakukan di backend (min 8 karakter, huruf + angka).
   * =============================================================
   */
  const hitungKekuatanPassword = (password: string): { level: number; label: string; color: string } => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 1) return { level: 1, label: 'Lemah', color: 'bg-red-500' };
    if (score <= 2) return { level: 2, label: 'Cukup', color: 'bg-yellow-500' };
    if (score <= 3) return { level: 3, label: 'Kuat', color: 'bg-blue-500' };
    return { level: 4, label: 'Sangat Kuat', color: 'bg-green-500' };
  };

  const kekuatanPassword = hitungKekuatanPassword(kataSandi);

  const handleDaftar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    /**
     * =============================================================
     * [OWASP A05 - Injection (XSS)]
     * 
     * Validasi input di frontend sebelum mengirim ke server.
     * Ini memberikan UX yang lebih baik (feedback instan)
     * dan mengurangi request yang tidak perlu ke server.
     * 
     * Ingat: Validasi frontend BUKAN pengganti validasi backend!
     * Backend juga melakukan validasi yang sama (atau lebih ketat).
     * =============================================================
     */
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(namaPengguna) || namaPengguna.trim().length < 2) {
      setError('Nama hanya boleh menggunakan huruf dan spasi (minimal 2 karakter).');
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Format email tidak valid.');
      setLoading(false);
      return;
    }

    /**
     * =============================================================
     * [OWASP A07 - Authentication Failures]
     * 
     * Validasi kekuatan password di frontend.
     * Aturan minimum yang sama dengan backend:
     * - Minimal 8 karakter
     * - Harus ada setidaknya 1 huruf
     * - Harus ada setidaknya 1 angka
     * =============================================================
     */
    if (kataSandi.length < 8) {
      setError('Password minimal 8 karakter.');
      setLoading(false);
      return;
    }
    if (!/[a-zA-Z]/.test(kataSandi)) {
      setError('Password harus mengandung minimal 1 huruf.');
      setLoading(false);
      return;
    }
    if (!/[0-9]/.test(kataSandi)) {
      setError('Password harus mengandung minimal 1 angka.');
      setLoading(false);
      return;
    }

    try {
      await authAPI.register(namaPengguna.trim(), email.trim(), kataSandi);
      setSuccess('Registrasi berhasil! Mengalihkan ke halaman login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: unknown) {
      /**
       * [OWASP A10 - Mishandling Exceptional Conditions]
       * Tampilkan pesan error yang aman dan user-friendly.
       */
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        setError(axiosError.response?.data?.message || 'Registrasi gagal, coba lagi nanti.');
      } else {
        setError('Registrasi gagal, terjadi kesalahan tidak terduga.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-xl border border-gray-200 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Daftar / Register</h2>
        
        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium text-center">
            {/**
             * [OWASP A05] React auto-escaping mencegah XSS.
             * Menggunakan {error} aman, BUKAN dangerouslySetInnerHTML.
             */}
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4 text-sm font-medium text-center">
            {success}
          </div>
        )}
        
        <form onSubmit={handleDaftar} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Nama (Name)</label>
            <input
              type="text"
              id="register-name"
              value={namaPengguna}
              onChange={(e) => setNamaPengguna(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="Masukkan nama Anda"
              required
              autoComplete="name"
              maxLength={100}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="register-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="Masukkan email aktif"
              required
              autoComplete="email"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Kata Sandi (Password)</label>
            <input
              type="password"
              id="register-password"
              value={kataSandi}
              onChange={(e) => setKataSandi(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="Buat kata sandi (min. 8 karakter, huruf + angka)"
              required
              autoComplete="new-password"
              minLength={8}
            />
            {/* 
              [OWASP A07 - Authentication Failures]
              Indikator kekuatan password untuk membantu user 
              membuat password yang aman.
            */}
            {kataSandi.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        level <= kekuatanPassword.level ? kekuatanPassword.color : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Kekuatan: <span className="font-medium">{kekuatanPassword.label}</span>
                </p>
              </div>
            )}
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Memproses...' : 'Daftar Akun'}
          </button>
        </form>
        
        <p className="mt-6 text-center text-sm text-gray-600">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-blue-600 font-semibold hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
