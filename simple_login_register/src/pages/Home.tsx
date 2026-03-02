import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { UserProfile } from '../types/api';

const Home: React.FC = () => {
  const [pengguna, setPengguna] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuth();

  useEffect(() => {
    const fetchProfil = async () => {
      try {
        const response = await authAPI.getProfile();
        setPengguna(response.data.data);
      } catch {
        /**
         * =============================================================
         * [OWASP A10 - Mishandling Exceptional Conditions]
         * 
         * Tampilkan pesan error yang generik dan user-friendly.
         * Jangan menampilkan detail teknis (network error, status code)
         * yang bisa membantu attacker memahami sistem.
         * =============================================================
         */
        setError('Gagal memuat profil. Sesi mungkin telah berakhir.');
        /**
         * [OWASP A04 - Cryptographic Failures]
         * 
         * SEBELUMNYA: localStorage.removeItem('authToken')
         * → Token di localStorage perlu dihapus manual ❌
         * 
         * SEKARANG: Cookie HttpOnly expired otomatis atau
         * dihapus via endpoint logout. Kita hanya perlu
         * updat state bahwa user sudah tidak terautentikasi.
         */
        setIsAuthenticated(false);
        setTimeout(() => navigate('/login'), 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchProfil();
  }, [navigate, setIsAuthenticated]);

  /**
   * =============================================================
   * [OWASP A04 - Cryptographic Failures]
   * 
   * Logout dilakukan via API call ke server untuk menghapus
   * HttpOnly cookie. Cookie ini TIDAK BISA dihapus oleh
   * JavaScript di browser.
   * 
   * SEBELUMNYA (TIDAK AMAN):
   * localStorage.removeItem('authToken'); ❌
   * → Hanya menghapus dari sisi client
   * → Token masih valid dan bisa digunakan sampai expired
   * 
   * SEKARANG (AMAN):
   * authAPI.logout() → Server menghapus cookie ✅
   * → Cookie benar-benar dihapus
   * =============================================================
   */
  const handleKeluar = async () => {
    try {
      await authAPI.logout();
    } catch {
      /**
       * [OWASP A09 - Logging & Monitoring Failures]
       * Jangan gunakan catch(e){} kosong!
       * Meskipun error saat logout, tetap redirect ke login.
       */
      console.warn('Logout request gagal, tetapi sesi lokal akan dihapus.');
    }
    setIsAuthenticated(false);
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 text-gray-500 text-lg font-medium">
        Memuat data sesi Anda...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      {/* Navbar */}
      <nav className="w-full bg-white border-b border-gray-200 sticky top-0 z-10 px-6 py-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 tracking-tight">App Dashboard</h2>
        <button 
          onClick={handleKeluar} 
          className="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
        >
          Keluar / Logout
        </button>
      </nav>
      
      {/* Konten Utama */}
      <main className="w-full max-w-3xl flex-1 flex flex-col items-center justify-center p-6">
        {error ? (
          <div className="bg-red-100 text-red-600 p-4 rounded-xl text-center font-medium w-full">
            {/**
             * [OWASP A05 - Injection (XSS)]
             * Menampilkan error menggunakan {error} (React auto-escaping).
             * BUKAN dangerouslySetInnerHTML yang rentan XSS.
             */}
            {error}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-2xl w-full border border-gray-100">
            <h1 className="text-3xl font-bold text-gray-800 border-b border-gray-100 pb-4 mb-6">
              {/**
               * [OWASP A05 - Injection (XSS)]
               * Data user (pengguna?.name) ditampilkan dengan React
               * auto-escaping. Jika nama mengandung karakter HTML/script,
               * React akan menampilkannya sebagai teks biasa, BUKAN dieksekusi.
               */}
              Selamat Datang, <span className="text-blue-600">{pengguna?.name}</span> ! 🎉
            </h1>
            
            <div className="space-y-4 text-gray-600 text-lg">
              <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-[100px_1fr] gap-4 items-center">
                <p className="font-semibold text-gray-500 uppercase text-xs tracking-wider">Nama</p>
                <p className="font-medium text-gray-800">{pengguna?.name}</p>
                
                <p className="font-semibold text-gray-500 uppercase text-xs tracking-wider">Email</p>
                <p className="font-medium text-gray-800">{pengguna?.email}</p>
              </div>
              
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
