import React, { useState } from 'react';
import { Outlet, Link, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services/notificationService';
import { NotificationDropdown } from '../components/notifications/NotificationDropdown';
import { UserMenu } from '../components/profile/UserMenu';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { BookOpen, Menu, X, LayoutDashboard, Users, BookOpen as BookIcon, ArrowLeftRight, Shield } from 'lucide-react';
import { Button } from '../components/ui/button';

export const AdminLayout: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Fetch notifications
  const { data: notifications = [], isLoading: isLoadingNotifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications(),
    enabled: isAuthenticated && !!user?.id,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = (id: number) => {
    notificationService.markAsRead(id).then(() => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });
  };

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead().then(() => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mobile hamburger menu */}
              <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                type="button"
                className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none md:hidden"
              >
                {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>

              <Link to="/admin" className="flex items-center gap-2 font-bold text-xl text-primary tracking-tight">
                <BookOpen className="h-6 w-6 text-primary" />
                <span className="flex items-center gap-1.5">
                  BookSwap <span className="bg-primary/10 text-primary text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full border border-primary/20">Admin</span>
                </span>
              </Link>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="hidden sm:flex text-xs font-bold text-muted-foreground hover:text-foreground">
                  Switch to User View
                </Button>
              </Link>
              <NotificationDropdown
                notifications={notifications}
                unreadCount={unreadCount}
                isLoading={isLoadingNotifications}
                onMarkRead={handleMarkRead}
                onMarkAllRead={handleMarkAllRead}
              />
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Main split-screen container */}
      <div className="flex">
        {/* Desktop Sidebar */}
        <AdminSidebar />

        {/* Mobile Sidebar overlay */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 top-16 bg-background/80 backdrop-blur-sm z-30 md:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}

        {/* Mobile Sidebar Drawer */}
        <aside
          className={`fixed inset-y-0 left-0 top-16 w-64 bg-card border-r border-border z-40 transform transition-transform duration-300 ease-in-out md:hidden ${
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-2 px-2 text-xs font-bold text-primary tracking-widest uppercase">
              <Shield className="h-4 w-4" />
              <span>Administration</span>
            </div>
            <nav className="space-y-1">
              {[
                { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard className="h-5 w-5" /> },
                { label: 'Users', path: '/admin/users', icon: <Users className="h-5 w-5" /> },
                { label: 'Books', path: '/admin/books', icon: <BookIcon className="h-5 w-5" /> },
                { label: 'Exchanges', path: '/admin/exchanges', icon: <ArrowLeftRight className="h-5 w-5" /> },
              ].map((item) => (
                <NavLink
                  key={item.label}
                  to={item.path}
                  end={item.path === '/admin'}
                  onClick={() => setIsMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                      isActive
                        ? 'bg-primary/10 text-primary font-bold shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/85'
                    }`
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
            <div className="border-t border-border pt-6">
              <Link to="/dashboard" onClick={() => setIsMobileOpen(false)}>
                <Button className="w-full text-xs font-bold">
                  Switch to User View
                </Button>
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
