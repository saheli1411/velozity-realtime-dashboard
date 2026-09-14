import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Role, TaskStatus, Priority } from '@prisma/client';
import { prisma } from '../prisma';
import { getIO } from '../services/socket.service';
import { z } from 'zod';

const updateStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus)
});

const createTaskSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  priority: z.nativeEnum(Priority),
  dueDate: z.string().datetime(),
  projectId: z.string().uuid(),
  developerId: z.string().uuid()
});

export const getTasks = async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { status, priority, dueBefore, dueAfter } = req.query;

  const filters: any = {};

  if (status) filters.status = status as TaskStatus;
  if (priority) filters.priority = priority as Priority;
  if (dueBefore || dueAfter) {
    filters.dueDate = {};
    if (dueBefore) filters.dueDate.lte = new Date(dueBefore as string);
    if (dueAfter) filters.dueDate.gte = new Date(dueAfter as string);
  }

  if (user.role === Role.DEVELOPER) {
    filters.developerId = user.id;
  } else if (user.role === Role.PROJECT_MANAGER) {
    filters.project = { creatorId: user.id };
  }

  const tasks = await prisma.task.findMany({
    where: filters,
    include: {
      project: { select: { id: true, name: true, creatorId: true } },
      developer: { select: { id: true, name: true, email: true } }
    },
    orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }]
  });

  return res.json({ success: true, data: tasks });
};

export const createTask = async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const parsed = createTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.format() });
  }

  const project = await prisma.project.findUnique({ where: { id: parsed.data.projectId } });
  if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

  if (user.role === Role.PROJECT_MANAGER && project.creatorId !== user.id) {
    return res.status(403).json({ success: false, error: 'Forbidden: You do not own this project' });
  }

  const task = await prisma.task.create({
    data: {
      ...parsed.data,
      dueDate: new Date(parsed.data.dueDate)
    },
    include: { developer: true, project: true }
  });

  // Create notification for assigned developer
  const notif = await prisma.notification.create({
    data: {
      userId: task.developerId,
      message: `You were assigned a new task: "${task.title}"`
    }
  });
  getIO().to(`user:${task.developerId}`).emit('new_notification', notif);

  return res.status(201).json({ success: true, data: task });
};

export const updateTaskStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;

  const parsed = updateStatusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: 'Invalid status' });

  const task = await prisma.task.findUnique({
    where: { id },
    include: { project: true }
  });

  if (!task) return res.status(404).json({ success: false, error: 'Task not found' });

  // STRICT RBAC
  if (user.role === Role.DEVELOPER && task.developerId !== user.id) {
    return res.status(403).json({ success: false, error: 'Cannot update tasks assigned to other developers' });
  }
  if (user.role === Role.PROJECT_MANAGER && task.project.creatorId !== user.id) {
    return res.status(403).json({ success: false, error: 'Cannot update tasks for projects you do not own' });
  }

  const fromStatus = task.status;
  const toStatus = parsed.data.status;

  const updatedTask = await prisma.task.update({
    where: { id },
    data: { status: toStatus }
  });

  const activity = await prisma.activityLog.create({
    data: {
      message: `${user.name} moved Task "${updatedTask.title}" from ${fromStatus} → ${toStatus}`,
      taskId: updatedTask.id,
      projectId: updatedTask.projectId,
      userId: user.id,
      fromStatus,
      toStatus
    },
    include: {
      user: { select: { id: true, name: true, role: true } },
      task: { select: { id: true, title: true } }
    }
  });

  // Real-time notification if moved to IN_REVIEW
  if (toStatus === TaskStatus.IN_REVIEW) {
    const pmId = task.project.creatorId;
    const notif = await prisma.notification.create({
      data: {
        userId: pmId,
        message: `Task "${task.title}" was moved to In Review by ${user.name}`
      }
    });
    getIO().to(`user:${pmId}`).emit('new_notification', notif);
  }

  // Socket updates
  getIO().to(`project:${task.projectId}`).emit('task_updated', updatedTask);
  getIO().emit('new_activity', activity);

  return res.json({ success: true, data: updatedTask });
};