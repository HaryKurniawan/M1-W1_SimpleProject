import { Router } from 'express';
import { register, login, getUser, logout } from '../controllers/userController';
import { verifyToken } from '../middlewares/authMiddleware';
import rateLimit from 'express-rate-limit';

/**
 * =============================================================
 * [OWASP A06 - Insecure Design]
 * 
 * Rate limiter KHUSUS untuk endpoint autentikasi (login/register).
 * Lebih ketat dari global limiter karena endpoint ini merupakan
 * target utama brute force attack.
 * 
 * Tanpa rate limiting, attacker bisa mengirim ribuan percobaan
 * login dalam waktu singkat menggunakan bot/script.
 * 
 * Konfigurasi: Maks 10 request per 15 menit per IP.
 * =============================================================
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 10,                  // Maks 10 percobaan per window
  message: {
    message: 'Terlalu banyak percobaan, coba lagi setelah 15 menit.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

/**
 * =============================================================
 * [OWASP A02 - Security Misconfiguration]
 * 
 * SEBELUMNYA: Menggunakan verifyApiKey middleware di setiap route.
 * Namun API Key dikirim dari frontend yang berarti nilainya
 * masuk ke JavaScript bundle dan bisa dilihat siapa saja
 * lewat browser DevTools → ini adalah FALSE SECURITY.
 * 
 * SEKARANG: verifyApiKey DIHAPUS dari routes.
 * Keamanan diganti dengan mekanisme yang lebih tepat:
 * - Rate Limiting (A06) → mencegah brute force & abuse
 * - CORS ketat (A02) → hanya origin frontend yang diizinkan
 * - JWT HttpOnly Cookie (A04) → autentikasi yang aman
 * - Helmet Headers (A02) → security headers otomatis
 * 
 * Jika API key memang diperlukan (misal untuk third-party API),
 * sebaiknya dikirim melalui BACKEND-ke-BACKEND communication,
 * BUKAN dari frontend.
 * =============================================================
 */

// Public Endpoints (dengan rate limiter ketat)
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

// Private Endpoints (memerlukan token valid)
router.get('/profile', verifyToken, getUser);

/**
 * =============================================================
 * [OWASP A04 - Cryptographic Failures]
 * 
 * Endpoint logout diperlukan untuk menghapus HttpOnly cookie
 * dari sisi server. Cookie HttpOnly TIDAK bisa dihapus
 * oleh JavaScript di browser, jadi harus ada endpoint khusus.
 * =============================================================
 */
router.post('/logout', verifyToken, logout);

export default router;
