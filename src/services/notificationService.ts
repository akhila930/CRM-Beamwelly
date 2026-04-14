
import { useState, useEffect } from 'react';

export interface Notification {
  id: number;
  text: string;
  read: boolean;
  timestamp: Date;
}

// Initial mock notifications
const initialNotifications: Notification[] = [
  { id: 1, text: "New task assigned to you", read: false, timestamp: new Date(Date.now() - 1000 * 60 * 30) },
  { id: 2, text: "Feedback request from manager", read: false, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) },
  { id: 3, text: "Your leave request was approved", read: false, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12) }
];

// Save notifications to localStorage
const saveNotifications = (notifications: Notification[]) => {
  localStorage.setItem('notifications', JSON.stringify(notifications));
};

// Load notifications from localStorage
const loadNotifications = (): Notification[] => {
  const saved = localStorage.getItem('notifications');
  if (saved) {
    try {
      // Parse the dates correctly
      const parsed = JSON.parse(saved);
      return parsed.map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp)
      }));
    } catch (e) {
      console.error('Failed to parse notifications from localStorage', e);
      return initialNotifications;
    }
  }
  return initialNotifications;
};

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Load notifications on initial render
  useEffect(() => {
    setNotifications(loadNotifications());
  }, []);

  // Mark a notification as read
  const markAsRead = (id: number) => {
    const updated = notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    );
    setNotifications(updated);
    saveNotifications(updated);
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    const updated = notifications.map(notification => ({ ...notification, read: true }));
    setNotifications(updated);
    saveNotifications(updated);
  };

  // Add a new notification
  const addNotification = (text: string) => {
    const newNotification: Notification = {
      id: Date.now(),
      text,
      read: false,
      timestamp: new Date()
    };
    const updated = [newNotification, ...notifications];
    setNotifications(updated);
    saveNotifications(updated);
  };

  // Remove a notification
  const removeNotification = (id: number) => {
    const updated = notifications.filter(notification => notification.id !== id);
    setNotifications(updated);
    saveNotifications(updated);
  };

  // Count unread notifications
  const unreadCount = notifications.filter(notification => !notification.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    removeNotification
  };
};
