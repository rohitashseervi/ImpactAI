import { useState, useEffect } from 'react';
import { Notification } from '../types';
import { listenToNotifications, markNotificationRead } from '../lib/firestore';
import { useAuth } from '../contexts/AuthContext';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = listenToNotifications(user.uid, setNotifications);
    return unsubscribe;
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (notifId: string) => {
    if (!user) return;
    await markNotificationRead(user.uid, notifId);
  };

  return { notifications, unreadCount, markAsRead };
}
