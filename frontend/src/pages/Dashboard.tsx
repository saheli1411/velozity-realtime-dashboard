import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { apiClient } from '../api/client';
import { ActivityFeed } from '../components/ActivityFeed';
import { NotificationDropdown } from '../components/NotificationDropdown';
import { TaskBoard } from '../components/TaskBoard';
import { useSearchParams } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { onlineCount, socket } = useSocket();
  const [tasks, setTasks] = useState<any[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();

  const fetchTasks = async () => {
    const params = new URLSearchParams(searchParams);
    const res = await apiClient.get(`/tasks?${params.toString()}`);
    setTasks(res.data.data);
  };

  useEffect(() => {
    fetchTasks();
  }, [searchParams]);

  useEffect(() => {
    if (!socket) return;
    socket.on('task_updated', () => fetchTasks());
    socket.on('tasks_overdue_flagged', () => fetchTasks());
    return () => {
      socket.off('task_updated');
      socket.off('tasks_overdue_flagged');
    };
  }, [socket]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Agency Dashboard</h1>
          <p className="text-xs text-gray-500">
            Welcome, {user?.name} ({user?.role})
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>{onlineCount} Online</span>
          </div>
          <NotificationDropdown />
          <button
            onClick={logout}
            className="text-xs font-medium text-gray-600 hover:text-red-600 transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          {/* Query Filter Bar */}
          <div className="flex space-x-3 bg-white p-3 rounded-lg border text-xs">
            <select
              value={searchParams.get('status') || ''}
              onChange={(e) => {
                const next = new URLSearchParams(searchParams);
                if (e.target.value) next.set('status', e.target.value);
                else next.delete('status');
                setSearchParams(next);
              }}
              className="border p-1.5 rounded"
            >
              <option value="">All Statuses</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="DONE">Done</option>
            </select>
            <select
              value={searchParams.get('priority') || ''}
              onChange={(e) => {
                const next = new URLSearchParams(searchParams);
                if (e.target.value) next.set('priority', e.target.value);
                else next.delete('priority');
                setSearchParams(next);
              }}
              className="border p-1.5 rounded"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          <TaskBoard tasks={tasks} onTaskUpdate={fetchTasks} />
        </div>

        <div className="lg:col-span-1">
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
};