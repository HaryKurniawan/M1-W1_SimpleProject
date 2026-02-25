import { Router } from 'express';
import { register, login, getUser } from '../controllers/userController';
import { verifyApiKey, verifyToken } from '../middlewares/authMiddleware';

const router = Router();

// Public Endpoints 
router.post('/register', verifyApiKey, register);
router.post('/login', verifyApiKey, login);

// Private Endpoints 
router.get('/profile', verifyApiKey, verifyToken, getUser);

export default router;
