import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: { id: string; role: Role; email: string; name: string };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token missing' });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || 'secret', (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Token expired or invalid' });
    }
    req.user = user as { id: string; role: Role; email: string; name: string };
    next();
  });
};

export const authorizeRoles = (...allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Insufficient privileges for this endpoint'
      });
    }
    next();
  };
};