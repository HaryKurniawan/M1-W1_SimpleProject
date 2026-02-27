import { Response } from 'express';
import prisma from '../../config/database';
import { AuthenticatedRequest } from '../../middlewares/authMiddleware';
import logger from '../../utils/logger';

export const getUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Tidak dapat mengautentikasi pengguna.' });
      return;
    }

    /**
     * =============================================================
     * [OWASP A01 - Broken Access Control]
     * 
     * Endpoint ini memanfaatkan ID user dari JWT token yang sudah
     * diverifikasi oleh middleware, BUKAN dari parameter URL.
     * 
     * Ini mencegah IDOR (Insecure Direct Object Reference):
     * Attacker tidak bisa mengubah ID di URL untuk melihat
     * profil user lain.
     * 
     * CONTOH YANG TIDAK AMAN:
     * GET /api/users/:id → user bisa ganti ID di URL ❌
     * 
     * CONTOH YANG AMAN (yang kita pakai):
     * GET /api/users/profile → ID dari JWT token ✅
     * =============================================================
     */
    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
      /**
       * [OWASP A01 - Broken Access Control]
       * 
       * Hanya SELECT field yang diperlukan, JANGAN select semua.
       * Ini mencegah kebocoran field sensitif seperti password hash.
       * 
       * BAD:  findUnique({ where: { id } }) → termasuk password ❌
       * GOOD: findUnique({ where: { id }, select: {...} }) ✅
       */
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        // password TIDAK di-select — jangan pernah kirim ke client
      },
    });

    if (!userProfile) {
      res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
      return;
    }

    res.status(200).json({
      message: 'Data profil berhasil diambil.',
      data: userProfile,
    });
  } catch (error) {
    /**
     * =============================================================
     * [OWASP A10 - Mishandling Exceptional Conditions]
     * 
     * Jangan kirim objek error ke response.
     * Detail error hanya dicatat di server log.
     * =============================================================
     */
    logger.error('Error saat mengambil profil user', {
      userId: req.user?.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

/**
 * =============================================================
 * [OWASP A04 - Cryptographic Failures]
 * 
 * Handler untuk logout — menghapus HttpOnly cookie.
 * Ini penting karena HttpOnly cookie tidak bisa dihapus
 * oleh JavaScript di browser, jadi harus dihapus dari server.
 * =============================================================
 */
export const logoutUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  /**
   * [A04] Cookie dihapus dengan cara meng-overwrite dengan 
   * value kosong dan maxAge 0.
   */
  res.clearCookie('authToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  /**
   * [OWASP A09 - Logging & Monitoring Failures]
   * Log aktivitas logout untuk audit trail.
   */
  logger.info('User logout', {
    userId: req.user?.id,
    ip: req.ip,
  });

  res.status(200).json({ message: 'Logout berhasil.' });
};
