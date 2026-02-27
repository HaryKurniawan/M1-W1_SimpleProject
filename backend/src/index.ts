import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import userRoutes from './routes/userRoutes';
import logger from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT;

/**
 * =============================================================
 * [OWASP A02 - Security Misconfiguration]
 * 
 * Helmet secara otomatis menambahkan HTTP security headers seperti:
 * - X-Content-Type-Options: nosniff
 * - X-Frame-Options: DENY
 * - Strict-Transport-Security (HSTS)
 * - X-XSS-Protection
 * 
 * Tanpa headers ini, browser tidak memiliki instruksi keamanan
 * tambahan dan aplikasi lebih rentan terhadap clickjacking,
 * MIME-type sniffing, dan serangan lainnya.
 * =============================================================
 */
app.use(helmet());

/**
 * =============================================================
 * [OWASP A02 - Security Misconfiguration]
 * 
 * CORS dikonfigurasi SECARA KETAT hanya untuk origin frontend.
 * Sebelumnya: app.use(cors()) — mengizinkan SEMUA origin.
 * Ini berbahaya karena website manapun bisa mengirim request
 * ke API kita dan mengakses data pengguna.
 * 
 * credentials: true diperlukan agar browser mengirim HttpOnly
 * cookie pada cross-origin request.
 * =============================================================
 */
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
}));

/**
 * =============================================================
 * [OWASP A04 - Cryptographic Failures]
 * 
 * Cookie parser diperlukan agar Express bisa membaca HttpOnly
 * cookie yang berisi JWT token. Ini JAUH lebih aman daripada
 * mengirim token melalui response body lalu menyimpannya
 * di localStorage (yang bisa dicuri via XSS).
 * =============================================================
 */
app.use(cookieParser());

/**
 * =============================================================
 * [OWASP A05 - Injection]
 * 
 * Membatasi ukuran request body ke 10KB untuk mencegah:
 * - Serangan denial-of-service via payload besar
 * - Injection via JSON body yang sangat panjang
 * 
 * Untuk aplikasi upload file, batas ini perlu disesuaikan.
 * =============================================================
 */
app.use(express.json({ limit: '10kb' }));

/**
 * =============================================================
 * [OWASP A06 - Insecure Design]
 * 
 * Rate limiter GLOBAL membatasi setiap IP address maksimal
 * 100 request per 15 menit. Ini mencegah:
 * - Brute force attack
 * - DDoS dari satu sumber
 * - Automated bot abuse
 * 
 * Endpoint login/register punya rate limiter LEBIH KETAT 
 * yang dikonfigurasi di file routes.
 * =============================================================
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100, // Maks 100 request per window
  message: {
    message: 'Terlalu banyak request dari IP ini, coba lagi setelah 15 menit.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// App routes
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('Simple Backend API running');
});

app.listen(PORT, () => {
  /**
   * [OWASP A09 - Logging & Monitoring Failures]
   * Gunakan logger terstruktur, bukan console.log biasa.
   */
  logger.info(`Server berjalan di http://localhost:${PORT}`);
});
