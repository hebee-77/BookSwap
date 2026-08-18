import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import type { Notification } from '../../types/notification';

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  onMarkRead: (id: number) => void;
  onMarkAllRead: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  unreadCount,
  isLoading,
  onMarkRead,
  onMarkAllRead,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMarkAllRead = () => {
    onMarkAllRead();
    toast.success('All notifications marked as read');
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
      return '';
    }
  };

  // Preview the first 4 items
  const previewItems = notifications.slice(0, 4);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        className="relative flex items-center justify-center h-9 w-9 rounded-full bg-muted hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
        aria-label={`Notifications, ${unreadCount} unread`}
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 px-1 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground leading-none animate-bounce shadow-sm">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-card shadow-lg z-50 overflow-hidden"
          >
            {/* Header info */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
              <span className="text-sm font-bold text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 focus:outline-none"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {/* List Body */}
            <div className="max-h-[280px] overflow-y-auto divide-y divide-border">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Syncing logs...</span>
                </div>
              ) : previewItems.length === 0 ? (
                <div className="text-center py-10 px-4 text-xs text-muted-foreground">
                  You're all caught up. New BookSwap activity will appear here.
                </div>
              ) : (
                previewItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onMarkRead(item.id);
                      setIsOpen(false);
                      navigate('/swap-requests');
                    }}
                    className={`w-full text-left p-3.5 hover:bg-muted/30 transition-colors flex items-start gap-2 ${
                      !item.read ? 'bg-primary/5 font-semibold' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-xs text-foreground leading-normal line-clamp-2">
                        {item.message}
                      </p>
                      <span className="text-[10px] text-muted-foreground block">
                        {getRelativeTime(item.createdAt)}
                      </span>
                    </div>
                    {!item.read && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Footer View All Link */}
            <div className="border-t border-border p-2 bg-muted/10 text-center">
              <Link
                to="/notifications"
                onClick={() => setIsOpen(false)}
                className="text-xs font-bold text-primary hover:underline block py-1"
              >
                View all notifications &rarr;
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
