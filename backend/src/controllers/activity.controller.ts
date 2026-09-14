import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';
import { prisma } from '../prisma';

export const getActivities = async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  let whereClause: any = {};

  if (user.role === Role.ADMIN) {
    whereClause = {};
  } else if (user.role === Role.PROJECT_MANAGER) {
    const pmProjects = await prisma.project.findMany({
      where: { creatorId: user.id },
      select: { id: true }
    });
    whereClause = { projectId: { in: pmProjects.map((p) => p.id) } };
  } else if (user.role === Role.DEVELOPER) {
    whereClause = { task: { developerId: user.id } };
  }

  const activities = await prisma.activityLog.findMany({
    where: whereClause,
    take: 20,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, role: true } },
      task: { select: { id: true, title: true } }
    }
  });

  return res.json({ success: true, data: activities });
};