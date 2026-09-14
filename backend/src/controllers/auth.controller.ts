import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../prisma';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const login = async (req: Request, res: Response) => {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ success: false, error: 'Invalid input format' });
  }

  const { email, password } = parseResult.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ success: false, error: 'Invalid email or password' });
  }

  const accessToken = jwt.sign(
    { id: user.id, role: user.role, email: user.email, name: user.name },
    process.env.ACCESS_TOKEN_SECRET || 'secret',
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.REFRESH_TOKEN_SECRET || 'secret',
    { expiresIn: '7d' }
  );

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken }
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.json({
    success: true,
    data: {
      accessToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    }
  });
};

export const refreshToken = async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ success: false, error: 'No refresh token' });

  jwt.verify(token, process.env.REFRESH_TOKEN_SECRET || 'secret', async (err: any, decoded: any) => {
    if (err) return res.status(403).json({ success: false, error: 'Invalid refresh token' });

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || user.refreshToken !== token) {
      return res.status(403).json({ success: false, error: 'Invalid session' });
    }

    const newAccessToken = jwt.sign(
      { id: user.id, role: user.role, email: user.email, name: user.name },
      process.env.ACCESS_TOKEN_SECRET || 'secret',
      { expiresIn: '15m' }
    );

    return res.json({ success: true, data: { accessToken: newAccessToken } });
  });
};

export const logout = async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;
  if (token) {
    await prisma.user.updateMany({
      where: { refreshToken: token },
      data: { refreshToken: null }
    });
  }
  res.clearCookie('refreshToken');
  return res.json({ success: true, message: 'Logged out successfully' });
};