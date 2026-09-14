import React from 'react';
import { apiClient } from '../api/client';

export const TaskBoard: React.FC<{ tasks: any[]; onTaskUpdate: () => void }> = ({
  tasks,
  onTaskUpdate,
}) => {
  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await apiClient.patch(`/tasks/${taskId}/status`, { status: newStatus });
      onTaskUpdate();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update status');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <table className="w-full text-left text-xs">
        <thead className="bg-gray-50 border-b text-gray-500 uppercase tracking-wider">
          <tr>
            <th className="py-3 px-4">Task</th>
            <th className="py-3 px-4">Project</th>
            <th className="py-3 px-4">Priority</th>
            <th className="py-3 px-4">Due Date</th>
            <th className="py-3 px-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {tasks.map((t) => (
            <tr key={t.id} className={t.isOverdue ? 'bg-red-50/40' : ''}>
              <td className="py-3 px-4 font-semibold text-gray-800">{t.title}</td>
              <td className="py-3 px-4 text-gray-500">{t.project?.name}</td>
              <td className="py-3 px-4">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    t.priority === 'CRITICAL'
                      ? 'bg-red-100 text-red-700'
                      : t.priority === 'HIGH'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {t.priority}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className={t.isOverdue ? 'text-red-600 font-bold' : 'text-gray-600'}>
                  {new Date(t.dueDate).toLocaleDateString()}
                  {t.isOverdue && ' (OVERDUE)'}
                </span>
              </td>
              <td className="py-3 px-4">
                <select
                  value={t.status}
                  onChange={(e) => handleStatusChange(t.id, e.target.value)}
                  className="bg-white border rounded px-2 py-1 text-xs outline-none"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="DONE">Done</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};