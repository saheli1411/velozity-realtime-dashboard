import jwt from 'jsonwebtoken';
import { Response } from 'express';

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || 'access_secret_velozity';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh_secret_velozity';

export const generateTokens = (user: { id: string; role: string; email: string }) => {
  const accessToken = jwt.sign({ id: user.id, role: user.role, email: user.email }, ACCESS_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

export const setRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};