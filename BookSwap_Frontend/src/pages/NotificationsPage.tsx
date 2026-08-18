import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Bell, CheckCheck, AlertCircle, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { notificationService } from '../services/notificationService';
import { NotificationItem } from '../components/notifications/NotificationItem';
import { NotificationSkeleton } from '../components/notifications/NotificationSkeleton';
import { EmptyNotifications } from '../components/notifications/EmptyNotifications';
import { Button } from '../components/ui/button';

type FilterType = 'all' | 'unread';

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterType>('all');

  // Fetch notifications from backend
  const { data: notifications = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications(),
    enabled: !!user?.id,
  });

  // Mutation for marking a notification as read
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mutation for marking all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('Failed to mark notifications read');
    },
  });

  // Mutation for deleting a notification
  const deleteMutation = useMutation({
    mutationFn: (id: number) => notificationService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification cleared');
    },
  });

  const unreadNotifications = notifications.filter((n) => !n.read);
  const displayedNotifications = filter === 'unread' ? unreadNotifications : notifications;

  const handleRead = (id: number) => {
    const target = notifications.find((n) => n.id === id);
    if (target && !target.read) {
      markAsReadMutation.mutate(id);
    }
  };

  const handleMarkAllRead = () => {
    if (unreadNotifications.length > 0) {
      markAllAsReadMutation.mutate();
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 bg-background">
      {/* Title Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl flex items-center gap-2">
            <Bell className="h-8 w-8 text-primary" />
            <span>Activity Center</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Check logs, swap updates, and exchange requests.
          </p>
        </div>
        
        {unreadNotifications.length > 0 && (
          <Button
            onClick={handleMarkAllRead}
            variant="outline"
            className="flex items-center gap-2 font-semibold self-start sm:self-auto"
            disabled={markAllAsReadMutation.isPending}
          >
            <CheckCheck className="h-4 w-4 text-primary" />
            <span>{markAllAsReadMutation.isPending ? 'Marking...' : 'Mark all read'}</span>
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          {(['all', 'unread'] as const).map((tab) => {
            const isActive = filter === tab;
            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                type="button"
                className={`px-4 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                  isActive
                    ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {tab === 'all' ? 'All Alerts' : `Unread (${unreadNotifications.length})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Alerts List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <NotificationSkeleton key={idx} />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-16">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive/80 mb-4" />
          <h3 className="text-lg font-bold text-foreground">Sync Failure</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Could not sync logs from BookSwap database.
          </p>
          <Button onClick={() => refetch()} variant="outline" className="mt-4">
            Retry Sync
          </Button>
        </div>
      ) : displayedNotifications.length === 0 ? (
        <EmptyNotifications />
      ) : (
        <div className="space-y-3.5">
          {displayedNotifications.map((notif) => (
            <div key={notif.id} className="relative group">
              <NotificationItem
                notification={notif}
                onRead={handleRead}
              />
              <button
                onClick={() => deleteMutation.mutate(notif.id)}
                className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive transition-all"
                title="Dismiss alert"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
