import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';

/**
 * =============================================================
 * [OWASP A01 - Broken Access Control]
 * 
 * Interface yang lebih ketat untuk user data dari JWT.
 * Sebelumnya menggunakan `any` yang tidak aman karena
 * tidak ada validasi tipe data.
 * =============================================================
 */
export interface JwtPayload {
  id: number;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

/**
 * =============================================================
 * [OWASP A01 - Broken Access Control]
 * 
 * Middleware untuk memverifikasi API Key pada setiap request.
 * API Key berfungsi sebagai lapisan pertama otorisasi untuk
 * memastikan hanya client yang sah yang bisa mengakses API.
 * =============================================================
 */
export const verifyApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    /**
     * [OWASP A09 - Logging & Monitoring Failures]
     * Log percobaan akses tanpa API Key untuk deteksi serangan.
     */
    logger.security('Percobaan akses tanpa API Key', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(403).json({ message: 'API Key diperlukan!' });
    return;
  }

  if (apiKey !== process.env.API_KEY) {
    /**
     * [OWASP A09 - Logging & Monitoring Failures]
     * Log API Key yang salah — bisa jadi indikasi serangan.
     */
    logger.security('API Key tidak valid', {
      ip: req.ip,
      path: req.path,
    });
    res.status(403).json({ message: 'API Key tidak valid!' });
    return;
  }

  next();
};

/**
 * =============================================================
 * [OWASP A04 - Cryptographic Failures]
 * 
 * Middleware untuk memverifikasi JWT token.
 * Token sekarang dibaca dari HttpOnly cookie TERLEBIH DAHULU,
 * lalu fallback ke Authorization header.
 * 
 * HttpOnly cookie TIDAK BISA diakses oleh JavaScript di browser,
 * sehingga aman dari pencurian via serangan XSS.
 * 
 * Sebelumnya: hanya membaca dari Authorization header,
 * yang berarti token disimpan di localStorage (rentan XSS).
 * =============================================================
 */
export const verifyToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  /**
   * [A04] Prioritas 1: Baca token dari HttpOnly cookie
   * [A04] Prioritas 2: Fallback ke Authorization header (untuk kompatibilitas)
   */
  const tokenFromCookie = req.cookies?.authToken;
  const authHeader = req.headers['authorization'];
  const tokenFromHeader = authHeader && authHeader.split(' ')[1];
  const token = tokenFromCookie || tokenFromHeader;

  if (!token) {
    /**
     * [OWASP A09 - Logging & Monitoring Failures]
     * Log akses tanpa token untuk mendeteksi percobaan tidak sah.
     */
    logger.security('Percobaan akses tanpa token', {
      ip: req.ip,
      path: req.path,
    });
    res.status(401).json({ message: 'Token akses diperlukan!' });
    return;
  }

  /**
   * [OWASP A07 - Authentication Failures]
   * 
   * JANGAN gunakan fallback secret key seperti 'secret'.
   * Jika JWT_SECRET tidak dikonfigurasi, lebih baik gagal
   * daripada menggunakan secret yang lemah dan bisa ditebak.
   */
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    logger.error('JWT_SECRET tidak dikonfigurasi di environment!');
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    return;
  }

  try {
    const decodedUser = jwt.verify(token, jwtSecret) as JwtPayload;
    req.user = decodedUser;
    next();
  } catch (err) {
    /**
     * [OWASP A09 - Logging & Monitoring Failures]
     * Log token yang tidak valid — bisa jadi token expired
     * atau sedang dicoba-coba oleh attacker.
     */
    logger.security('Token tidak valid atau expired', {
      ip: req.ip,
      path: req.path,
      errorType: err instanceof Error ? err.name : 'Unknown',
    });
    res.status(403).json({ message: 'Token tidak valid atau sudah expired!' });
    return;
  }
};
