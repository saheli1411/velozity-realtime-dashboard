import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { apiClient } from '../api/client';

export const NotificationDropdown: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    apiClient.get('/notifications').then((res) => setNotifications(res.data.data));

    if (!socket) return;
    socket.on('new_notification', (notif: any) => {
      setNotifications((prev) => [notif, ...prev]);
    });

    return () => {
      socket.off('new_notification');
    };
  }, [socket]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllRead = async () => {
    await apiClient.patch('/notifications/mark-read');
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition"
      >
        <Bell className="w-5 h-5 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-b">
            <span className="font-semibold text-xs text-gray-700 uppercase tracking-wider">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <p className="p-4 text-xs text-gray-400 text-center">No notifications</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`p-3 text-xs ${n.isRead ? 'bg-white' : 'bg-blue-50'}`}>
                  <p className="text-gray-800 font-medium">{n.message}</p>
                  <span className="text-gray-400 mt-1 block">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};