import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { prisma } from '../prisma';

let io: Server;
const activeUsers = new Map<string, string>(); // socketId -> userId

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication token required'));

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || 'secret', (err: any, decoded: any) => {
      if (err) return next(new Error('Authentication failed'));
      socket.data.user = decoded;
      next();
    });
  });

  io.on('connection', async (socket: Socket) => {
    const user = socket.data.user as { id: string; role: Role; email: string };
    activeUsers.set(socket.id, user.id);

    socket.join(`user:${user.id}`);

    const broadcastPresence = () => {
      const uniqueOnline = new Set(activeUsers.values()).size;
      io.emit('presence_update', { onlineCount: uniqueOnline });
    };

    broadcastPresence();

    socket.on('join_project', async (projectId: string) => {
      if (user.role === Role.ADMIN) {
        socket.join(`project:${projectId}`);
      } else if (user.role === Role.PROJECT_MANAGER) {
        const hasProject = await prisma.project.findFirst({
          where: { id: projectId, creatorId: user.id }
        });
        if (hasProject) socket.join(`project:${projectId}`);
      } else if (user.role === Role.DEVELOPER) {
        const hasTask = await prisma.task.findFirst({
          where: { projectId, developerId: user.id }
        });
        if (hasTask) socket.join(`project:${projectId}`);
      }
    });

    socket.on('disconnect', () => {
      activeUsers.delete(socket.id);
      broadcastPresence();
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};