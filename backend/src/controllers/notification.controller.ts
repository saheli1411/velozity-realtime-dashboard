import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../prisma';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 30
  });
  return res.json({ success: true, data: notifications });
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true }
  });
  return res.json({ success: true, message: 'All notifications marked as read' });
};