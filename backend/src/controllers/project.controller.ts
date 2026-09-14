import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Role } from '@prisma/client';
import { prisma } from '../prisma';
import { z } from 'zod';

const createProjectSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  clientId: z.string().uuid()
});

export const getProjects = async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  let projects;

  if (user.role === Role.ADMIN) {
    projects = await prisma.project.findMany({
      include: { client: true, creator: { select: { id: true, name: true, email: true } }, tasks: true },
      orderBy: { createdAt: 'desc' }
    });
  } else if (user.role === Role.PROJECT_MANAGER) {
    projects = await prisma.project.findMany({
      where: { creatorId: user.id },
      include: { client: true, tasks: true },
      orderBy: { createdAt: 'desc' }
    });
  } else {
    // Developers only get projects that contain their assigned tasks
    projects = await prisma.project.findMany({
      where: { tasks: { some: { developerId: user.id } } },
      include: {
        tasks: { where: { developerId: user.id } },
        client: true
      }
    });
  }

  return res.json({ success: true, data: projects });
};

export const createProject = async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const parsed = createProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.format() });
  }

  const project = await prisma.project.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      clientId: parsed.data.clientId,
      creatorId: user.id
    },
    include: { client: true }
  });

  return res.status(201).json({ success: true, data: project });
};