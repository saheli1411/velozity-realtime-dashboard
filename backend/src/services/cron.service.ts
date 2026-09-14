import cron from 'node-cron';
import { TaskStatus } from '@prisma/client';
import { prisma } from '../prisma';
import { getIO } from './socket.service';

export const initBackgroundJobs = () => {
  // Check every minute for overdue tasks
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const overdueTasks = await prisma.task.findMany({
        where: {
          dueDate: { lt: now },
          status: { not: TaskStatus.DONE },
          isOverdue: false
        }
      });

      if (overdueTasks.length > 0) {
        const ids = overdueTasks.map((t) => t.id);
        await prisma.task.updateMany({
          where: { id: { in: ids } },
          data: { isOverdue: true }
        });

        for (const t of overdueTasks) {
          await prisma.activityLog.create({
            data: {
              message: `Task "${t.title}" flagged as OVERDUE`,
              taskId: t.id,
              projectId: t.projectId,
              userId: t.developerId,
              fromStatus: t.status,
              toStatus: t.status
            }
          });
        }

        getIO().emit('tasks_overdue_flagged', { taskIds: ids });
      }
    } catch (err) {
      console.error('Overdue cron error:', err);
    }
  });
};