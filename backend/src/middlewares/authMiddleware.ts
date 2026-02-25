import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const verifyApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    res.status(403).json({ message: 'API Key is required!' });
    return;
  }

  if (apiKey !== process.env.API_KEY) {
    res.status(403).json({ message: 'Invalid API Key!' });
    return;
  }

  next();
};

export const verifyToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer TOKEN

  if (!token) {
    res.status(401).json({ message: 'Access token is required!' });
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, decodedUser) => {
    if (err) {
      res.status(403).json({ message: 'Invalid or expired token!' });
      return;
    }

    req.user = decodedUser;
    next();
  });
};
