import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { apiClient } from '../api/client';
import { formatDistanceToNow } from 'date-fns';

export const ActivityFeed: React.FC = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const { socket } = useSocket();

  useEffect(() => {
    // Initial fetch of last 20 DB events
    apiClient.get('/activities').then((res) => setActivities(res.data.data));

    if (!socket) return;
    socket.on('new_activity', (act: any) => {
      setActivities((prev) => [act, ...prev.slice(0, 19)]);
    });

    return () => {
      socket.off('new_activity');
    };
  }, [socket]);

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
      <h3 className="font-bold text-sm text-gray-800 mb-3 uppercase tracking-wider">Live Activity Feed</h3>
      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {activities.map((a) => (
          <div key={a.id} className="text-xs border-l-2 border-blue-500 pl-3 py-1">
            <p className="text-gray-800 font-medium">{a.message}</p>
            <span className="text-gray-400 text-[10px]">
              {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};