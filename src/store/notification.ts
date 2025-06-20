// src/store/notification.ts


import { create } from 'zustand';
import { ActivityItem } from '@/types';

interface NotificationStore {
  notifications: ActivityItem[];
  unreadCount: number;
  addNotification: (notification: ActivityItem) => void;
  markAsRead: () => void;
  setNotifications: (notifications: ActivityItem[]) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),
  markAsRead: () => set({ unreadCount: 0 }),
  setNotifications: (notifications) =>
    set({ notifications, unreadCount: notifications.length }),
}));
