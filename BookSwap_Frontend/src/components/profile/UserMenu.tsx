import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { User, LogOut, LayoutDashboard, BookMarked, ArrowLeftRight, Shield, Star } from 'lucide-react';

export const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
    setIsOpen(false);
  };

  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const isAdmin = user.roles?.includes('ROLE_ADMIN');

  const menuItems = [
    ...(isAdmin ? [{ label: 'Admin Dashboard', path: '/admin', icon: <Shield className="h-4 w-4" /> }] : []),
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: 'My Books', path: '/my-books', icon: <BookMarked className="h-4 w-4" /> },
    { label: 'Swap Requests', path: '/swap-requests', icon: <ArrowLeftRight className="h-4 w-4" /> },
    { label: 'My Reviews', path: '/my-reviews', icon: <Star className="h-4 w-4" /> },
    { label: 'Profile', path: '/profile', icon: <User className="h-4 w-4" /> },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Circle Initials Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        className="flex items-center justify-center h-9 w-9 rounded-full bg-primary text-primary-foreground font-bold text-sm shadow border border-primary/20 hover:opacity-90 transition-opacity focus:outline-none"
      >
        {getInitials(user.name)}
      </button>

      {/* Dropdown Menu panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-card shadow-lg z-50 overflow-hidden"
          >
            {/* Header info */}
            <div className="px-4 py-3 border-b border-border bg-muted/20">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account</p>
              <p className="text-sm font-bold text-foreground truncate mt-1">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>

            {/* Menu Items */}
            <div className="p-1.5 space-y-0.5">
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all"
                >
                  <span className="text-muted-foreground/80">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Divider & Logout */}
            <div className="border-t border-border p-1.5 bg-muted/10">
              <button
                onClick={handleLogout}
                type="button"
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold rounded-lg text-destructive hover:bg-destructive/10 transition-colors text-left"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
