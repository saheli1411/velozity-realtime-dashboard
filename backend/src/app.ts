import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { login, refreshToken, logout } from './controllers/auth.controller';
import { getProjects, createProject } from './controllers/project.controller';
import { getTasks, createTask, updateTaskStatus } from './controllers/task.controller';
import { getActivities } from './controllers/activity.controller';
import { getNotifications, markAllAsRead } from './controllers/notification.controller';
import { authenticateToken, authorizeRoles } from './middlewares/auth.middleware';
import { Role } from '@prisma/client';

export const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Auth
app.post('/api/auth/login', login);
app.post('/api/auth/refresh', refreshToken);
app.post('/api/auth/logout', logout);

// Projects
app.get('/api/projects', authenticateToken, getProjects);
app.post('/api/projects', authenticateToken, authorizeRoles(Role.ADMIN, Role.PROJECT_MANAGER), createProject);

// Tasks
app.get('/api/tasks', authenticateToken, getTasks);
app.post('/api/tasks', authenticateToken, authorizeRoles(Role.ADMIN, Role.PROJECT_MANAGER), createTask);
app.patch('/api/tasks/:id/status', authenticateToken, updateTaskStatus);

// Activity
app.get('/api/activities', authenticateToken, getActivities);

// Notifications
app.get('/api/notifications', authenticateToken, getNotifications);
app.patch('/api/notifications/mark-read', authenticateToken, markAllAsRead);

// Health
app.get('/health', (_req, res) => res.json({ status: 'ok' }));