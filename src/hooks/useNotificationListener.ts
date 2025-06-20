// src/hooks/useNotificationListener.ts

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useNotificationStore } from '@/store/notification';
import { useAuth } from './useAuth';
import { ActivityItem } from '@/types';

export function useNotificationListener() {
  const { user } = useAuth();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    if (!user) return;

    // Fetch initial unread notifications (optional)
    const fetchInitialNotifications = async () => {
        // You could fetch recent activity here to populate the list on load
    };

    fetchInitialNotifications();

    // Subscribe to new activity in real-time
    const channel = supabase
      .channel('public:activity_log')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_log', filter: `user_id=eq.${user.id}` },
        (payload) => {
          console.log('🎉 New activity received:', payload.new);
          const newActivity = payload.new;
          const notification: ActivityItem = {
              id: newActivity.id,
              type: newActivity.action,
              capsuleId: newActivity.capsule_id,
              capsuleTitle: newActivity.metadata?.capsuleTitle || 'a capsule',
              timestamp: new Date(newActivity.created_at),
              description: newActivity.description
          };
          addNotification(notification);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, addNotification]);
}
