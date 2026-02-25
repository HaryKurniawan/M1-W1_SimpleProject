import { Response } from 'express';
import prisma from '../../config/database';
import { AuthenticatedRequest } from '../../middlewares/authMiddleware';

export const getUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Tidak dapat mengautentikasi pengguna.' });
      return;
    }

    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!userProfile) {
      res.status(404).json({ message: 'Pengguna tidak ditemukan' });
      return;
    }

    res.status(200).json({
      message: 'Data profil berhasil diambil',
      data: userProfile,
    });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan pada server', error });
  }
};
