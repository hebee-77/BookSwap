import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeftRight, CheckCircle2, XCircle, Bell, Clock } from 'lucide-react';
import type { Notification } from '../../types/notification';

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: number) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onRead }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'SWAP_REQUEST':
        return (
          <div className="h-9 w-9 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center border border-blue-500/20">
            <ArrowLeftRight className="h-4.5 w-4.5" />
          </div>
        );
      case 'REQUEST_ACCEPTED':
        return (
          <div className="h-9 w-9 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20">
            <CheckCircle2 className="h-4.5 w-4.5" />
          </div>
        );
      case 'REQUEST_REJECTED':
        return (
          <div className="h-9 w-9 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center border border-rose-500/20">
            <XCircle className="h-4.5 w-4.5" />
          </div>
        );
      default:
        return (
          <div className="h-9 w-9 rounded-full bg-muted text-muted-foreground flex items-center justify-center border border-border">
            <Bell className="h-4.5 w-4.5" />
          </div>
        );
    }
  };

  const getRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (e) {
      return 'Some time ago';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 border border-border rounded-xl bg-card shadow-sm hover:border-muted-foreground/20 transition-all ${
        !notification.read ? 'border-l-4 border-l-primary bg-primary/5' : ''
      }`}
    >
      <Link
        to="/swap-requests"
        onClick={() => onRead(notification.id)}
        className="flex items-start gap-3.5"
      >
        {/* Left icon badge */}
        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
        
        {/* Middle message body */}
        <div className="flex-grow min-w-0 space-y-1">
          <p className={`text-sm text-foreground leading-relaxed ${!notification.read ? 'font-bold' : 'font-medium'}`}>
            {notification.message}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{getRelativeTime(notification.createdAt)}</span>
            {!notification.read && (
              <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
