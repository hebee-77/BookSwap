import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { BookOpen, Menu, X, LogOut, User } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { bookService } from '../../services/bookService';
import { swapService } from '../../services/swapService';
import { NotificationDropdown } from '../notifications/NotificationDropdown';
import { UserMenu } from '../profile/UserMenu';
import { notificationService } from '../../services/notificationService';
export const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Fetch pending swap requests count dynamically
  const { data: userBooksData } = useQuery({
    queryKey: ['user-books', user?.id],
    queryFn: () => bookService.getBooksByOwner(user!.id),
    enabled: isAuthenticated && !!user?.id,
  });

  const { data: allRequests = [] } = useQuery({
    queryKey: ['swap-requests'],
    queryFn: () => swapService.getAllRequests(),
    enabled: isAuthenticated && !!user?.id,
  });

  const userBooks = userBooksData?.content || [];
  const userBookIds = new Set(userBooks.map((b) => b.id));
  const pendingReceivedCount = allRequests.filter(
    (req) => req.status === 'PENDING' && userBookIds.has(req.bookId) && req.requesterId !== user?.id
  ).length;

  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading: isLoadingNotifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications(),
    enabled: isAuthenticated && !!user?.id,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = (id: number) => {
    const target = notifications.find((n) => n.id === id);
    if (target && !target.read) {
      notificationService.markAsRead(id).then(() => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      });
    }
  };

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead().then(() => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
    setIsMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo / Branding */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary tracking-tight transition-transform hover:scale-[1.02]">
            <BookOpen className="h-6 w-6 text-primary" />
            <span>BookSwap</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-6">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive('/') ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Home
            </Link>
            
            <Link
              to="/books"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive('/books') ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Browse Books
            </Link>

            {isAuthenticated && (
              <Link
                to="/books/new"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/books/new') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                Add Book
              </Link>
            )}

            {isAuthenticated && (
              <Link
                to="/swap-requests"
                className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-1.5 ${
                  isActive('/swap-requests') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <span>Swap Requests</span>
                {pendingReceivedCount > 0 && (
                  <span className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold h-4.5 px-1.5 leading-none shadow-sm">
                    {pendingReceivedCount}
                  </span>
                )}
              </Link>
            )}

            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive('/dashboard') ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  Dashboard
                </Link>

                <div className="flex items-center gap-4 ml-2 border-l border-border pl-6">
                  <NotificationDropdown
                    notifications={notifications}
                    unreadCount={unreadCount}
                    isLoading={isLoadingNotifications}
                    onMarkRead={handleMarkRead}
                    onMarkAllRead={handleMarkAllRead}
                  />
                  <UserMenu />
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 ml-2 border-l border-border pl-6">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Register</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-b border-border bg-background animate-in slide-in-from-top-4 duration-200">
          <div className="space-y-1 px-2 pb-3 pt-2">
            <Link
              to="/"
              onClick={() => setIsMenuOpen(false)}
              className={`block rounded-md px-3 py-2 text-base font-medium ${
                isActive('/') ? 'bg-muted text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              Home
            </Link>
            
            <Link
              to="/books"
              onClick={() => setIsMenuOpen(false)}
              className={`block rounded-md px-3 py-2 text-base font-medium ${
                isActive('/books') ? 'bg-muted text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              Browse Books
            </Link>

            {isAuthenticated && (
              <Link
                to="/books/new"
                onClick={() => setIsMenuOpen(false)}
                className={`block rounded-md px-3 py-2 text-base font-medium ${
                  isActive('/books/new') ? 'bg-muted text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                Add Book
              </Link>
            )}

            {isAuthenticated && (
              <Link
                to="/swap-requests"
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center justify-between rounded-md px-3 py-2 text-base font-medium ${
                  isActive('/swap-requests') ? 'bg-muted text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <span>Swap Requests</span>
                {pendingReceivedCount > 0 && (
                  <span className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold h-5 px-2 leading-none shadow-sm">
                    {pendingReceivedCount}
                  </span>
                )}
              </Link>
            )}

            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className={`block rounded-md px-3 py-2 text-base font-medium ${
                    isActive('/dashboard') ? 'bg-muted text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/my-books"
                  onClick={() => setIsMenuOpen(false)}
                  className={`block rounded-md px-3 py-2 text-base font-medium ${
                    isActive('/my-books') ? 'bg-muted text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  My Books
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className={`block rounded-md px-3 py-2 text-base font-medium ${
                    isActive('/profile') ? 'bg-muted text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  Profile
                </Link>
                <Link
                  to="/notifications"
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center justify-between rounded-md px-3 py-2 text-base font-medium ${
                    isActive('/notifications') ? 'bg-muted text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold h-5 px-2 leading-none shadow-sm">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <div className="mt-4 border-t border-border pt-4 px-3">
                  <div className="flex items-center gap-2 py-2 text-base font-medium text-foreground">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <span>{user?.name || user?.email}</span>
                  </div>
                  <Button onClick={handleLogout} variant="destructive" className="w-full mt-2 flex items-center justify-center gap-2">
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </Button>
                </div>
              </>
            ) : (
              <div className="mt-4 border-t border-border pt-4 px-3 flex flex-col gap-2">
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="w-full">
                  <Button variant="outline" className="w-full">
                    Login
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setIsMenuOpen(false)} className="w-full">
                  <Button className="w-full">Register</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
