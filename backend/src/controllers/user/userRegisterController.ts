import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../../config/database';
import logger from '../../utils/logger';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    /**
     * =============================================================
     * [OWASP A05 - Injection]
     * 
     * Validasi bahwa semua input ada dan bertipe string.
     * Input yang bukan string (misal: objek atau array) bisa
     * menyebabkan perilaku tidak terduga pada operasi database.
     * =============================================================
     */
    if (!name || !email || !password || typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({ message: 'Nama, email, dan password wajib diisi!' });
      return;
    }

    /**
     * =============================================================
     * [OWASP A05 - Injection]
     * 
     * Sanitasi input: trim whitespace untuk mencegah input
     * yang tampak valid tapi sebenarnya berisi spasi tersembunyi.
     * =============================================================
     */
    const cleanName = name.trim();
    const cleanEmail = email.toLowerCase().trim();

    /**
     * [OWASP A05 - Injection]
     * Validasi format nama — hanya huruf dan spasi yang diizinkan.
     * Ini mencegah injection karakter khusus melalui field nama.
     */
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(cleanName) || cleanName.length < 2 || cleanName.length > 100) {
      res.status(400).json({ message: 'Nama hanya boleh terdiri dari huruf dan spasi (2-100 karakter)!' });
      return;
    }

    /**
     * [OWASP A05 - Injection]
     * Validasi format email menggunakan regex sederhana.
     */
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      res.status(400).json({ message: 'Format email tidak valid!' });
      return;
    }

    /**
     * =============================================================
     * [OWASP A07 - Authentication Failures]
     * 
     * Password policy yang kuat untuk mencegah penggunaan 
     * password lemah yang mudah di-crack dengan brute force 
     * atau dictionary attack.
     * 
     * Aturan minimum:
     * - Minimal 8 karakter
     * - Harus mengandung setidaknya 1 huruf
     * - Harus mengandung setidaknya 1 angka
     * 
     * Pada production, sebaiknya tambahkan:
     * - Minimal 1 karakter spesial
     * - Cek terhadap daftar password umum (rockyou.txt)
     * - Cek terhadap Have I Been Pwned API
     * =============================================================
     */
    if (password.length < 8) {
      res.status(400).json({ message: 'Password minimal 8 karakter!' });
      return;
    }
    if (!/[a-zA-Z]/.test(password)) {
      res.status(400).json({ message: 'Password harus mengandung minimal 1 huruf!' });
      return;
    }
    if (!/[0-9]/.test(password)) {
      res.status(400).json({ message: 'Password harus mengandung minimal 1 angka!' });
      return;
    }

    const userExists = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (userExists) {
      res.status(400).json({ message: 'Email sudah terdaftar!' });
      return;
    }

    /**
     * =============================================================
     * [OWASP A07 - Authentication Failures]
     * 
     * Menggunakan bcrypt dengan salt rounds = 12 untuk hashing.
     * bcrypt memiliki beberapa keunggulan:
     * 1. Salt otomatis di-generate (mencegah rainbow table attack)
     * 2. Work factor bisa ditingkatkan seiring peningkatan hardware
     * 3. Algoritmanya sengaja lambat (resistant terhadap brute force)
     * 
     * Salt rounds 12 memberikan keseimbangan antara keamanan dan
     * kecepatan. Semakin tinggi angkanya, semakin lambat tapi aman.
     * =============================================================
     */
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        password: hashedPassword,
      },
    });

    /**
     * [OWASP A09 - Logging & Monitoring Failures]
     * Log registrasi berhasil untuk audit trail.
     */
    logger.info('User baru terdaftar', {
      userId: newUser.id,
      email: newUser.email,
      ip: req.ip,
    });

    res.status(201).json({
      message: 'Registrasi berhasil!',
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    /**
     * =============================================================
     * [OWASP A10 - Mishandling Exceptional Conditions]
     * 
     * Detail error TIDAK boleh dikirim ke client.
     * Cukup pesan generik, detail disimpan di server log.
     * 
     * SEBELUMNYA (TIDAK AMAN):
     * res.status(500).json({ message: '...', error }) ❌
     * → Response bisa berisi stack trace atau info database
     * 
     * SEKARANG (AMAN):
     * res.status(500).json({ message: '...' }) ✅
     * → Detail error disimpan di log server saja
     * =============================================================
     */
    logger.error('Error pada proses registrasi', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};
