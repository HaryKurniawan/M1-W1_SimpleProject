import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import type { UserProfile } from '../types/api';

const Home: React.FC = () => {
  const [pengguna, setPengguna] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfil = async () => {
      try {
        const response = await authAPI.getProfile();
        setPengguna(response.data.data);
      } catch {
        setError('Gagal memuat profil. Sesi mungkin telah berakhir.');
        localStorage.removeItem('authToken');
        setTimeout(() => navigate('/login'), 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchProfil();
  }, [navigate]);

  const handleKeluar = () => {
    localStorage.removeItem('authToken');
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
      <nav className="w-full bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10 px-6 py-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 tracking-tight">App Dashboard</h2>
        <button 
          onClick={handleKeluar} 
          className="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm shadow-sm"
        >
          Keluar / Logout
        </button>
      </nav>
      
      {/* Konten Utama */}
      <main className="w-full max-w-3xl flex-1 flex flex-col items-center justify-center p-6">
        {error ? (
          <div className="bg-red-100 text-red-600 p-4 rounded-xl text-center font-medium w-full shadow-sm">
            {error}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-2xl shadow-md w-full border border-gray-100">
            <h1 className="text-3xl font-bold text-gray-800 border-b border-gray-100 pb-4 mb-6">
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
