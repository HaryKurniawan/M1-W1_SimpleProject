import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../config/database';
import logger from '../../utils/logger';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    /**
     * =============================================================
     * [OWASP A05 - Injection]
     * 
     * Validasi bahwa input ada dan bertipe string.
     * Ini mencegah injection via tipe data yang tidak diharapkan
     * seperti objek atau array yang bisa memanipulasi query.
     * =============================================================
     */
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({ message: 'Email dan password wajib diisi!' });
      return;
    }

    /**
     * =============================================================
     * [OWASP A05 - Injection]
     * 
     * Validasi format email menggunakan regex sederhana.
     * Ini mencegah input berbahaya masuk ke database query.
     * =============================================================
     */
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ message: 'Format email tidak valid!' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    /**
     * =============================================================
     * [OWASP A07 - Authentication Failures]
     * 
     * Pesan error SAMA untuk email salah dan password salah.
     * Jika pesannya berbeda (misal: "Email tidak ditemukan" vs
     * "Password salah"), attacker bisa melakukan user enumeration
     * untuk mengetahui email mana yang terdaftar di sistem.
     * =============================================================
     */
    if (!user) {
      /**
       * [OWASP A09 - Logging & Monitoring Failures]
       * Log login gagal untuk mendeteksi brute force attack.
       */
      logger.security('Login gagal - email tidak ditemukan', {
        email: email,
        ip: req.ip,
      });
      res.status(401).json({ message: 'Email atau password tidak valid!' });
      return;
    }

    /**
     * =============================================================
     * [OWASP A07 - Authentication Failures]
     * 
     * Menggunakan bcrypt.compare() untuk membandingkan password.
     * bcrypt adalah salah satu algoritma hashing yang direkomendasikan
     * karena memiliki "salt" bawaan dan adjustable work factor 
     * yang membuatnya tahan terhadap brute force.
     * 
     * JANGAN PERNAH bandingkan password secara langsung:
     * BAD:  if (password === user.password) ❌
     * GOOD: bcrypt.compare(password, hash) ✅
     * =============================================================
     */
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      /**
       * [OWASP A09 - Logging & Monitoring Failures]
       * Log login gagal — jika terjadi berulang kali dari IP yang sama,
       * ini kemungkinan besar brute force attack.
       */
      logger.security('Login gagal - password salah', {
        userId: user.id,
        email: user.email,
        ip: req.ip,
      });
      res.status(401).json({ message: 'Email atau password tidak valid!' });
      return;
    }

    /**
     * [OWASP A07 - Authentication Failures]
     * Jangan gunakan fallback secret key yang lemah.
     */
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET tidak dikonfigurasi!');
      res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      jwtSecret,
      { expiresIn: '1d' }
    );

    /**
     * =============================================================
     * [OWASP A04 - Cryptographic Failures]
     * 
     * Token JWT dikirim melalui HttpOnly cookie, BUKAN di 
     * response body. Keuntungannya:
     * 
     * - httpOnly: true  → JavaScript TIDAK BISA mengakses cookie ini.
     *   Jika ada serangan XSS, attacker tetap tidak bisa mencuri token.
     * 
     * - secure: true    → Cookie hanya dikirim via HTTPS.
     *   (Di development, kita set false agar bisa test di localhost)
     * 
     * - sameSite: 'lax' → Mencegah cookie dikirim pada cross-site
     *   request yang berbahaya (mitigasi CSRF).
     * 
     * - maxAge: 86400000 → Cookie expired dalam 24 jam (= JWT expiry).
     * 
     * SEBELUMNYA (TIDAK AMAN):
     * res.json({ token }) → Token dikirim di body → disimpan di 
     * localStorage → bisa dicuri via XSS: localStorage.getItem('token')
     * =============================================================
     */
    res.cookie('authToken', token, {
      httpOnly: true,                                       // [A04] Tidak bisa diakses JavaScript
      secure: process.env.NODE_ENV === 'production',       // [A04] HTTPS only di production
      sameSite: 'lax',                                     // [A04] Mitigasi CSRF
      maxAge: 24 * 60 * 60 * 1000,                        // 24 jam
    });

    /**
     * [OWASP A09 - Logging & Monitoring Failures]
     * Log login berhasil untuk audit trail.
     */
    logger.info('Login berhasil', {
      userId: user.id,
      email: user.email,
      ip: req.ip,
    });

    /**
     * [OWASP A04] Token TIDAK dikirim di response body lagi.
     * Frontend cukup tahu bahwa login berhasil, tanpa perlu
     * menyimpan token secara manual.
     */
    res.status(200).json({
      message: 'Login berhasil!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    /**
     * =============================================================
     * [OWASP A10 - Mishandling Exceptional Conditions]
     * 
     * JANGAN kirim detail error ke client! 
     * SEBELUMNYA: res.status(500).json({ message: '...', error })
     * Ini bisa mengekspos stack trace, query SQL, atau struktur 
     * database yang sangat membantu attacker.
     * 
     * SEKARANG: Kirim pesan generik, dan simpan detail di server log.
     * =============================================================
     */
    logger.error('Error pada proses login', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};
