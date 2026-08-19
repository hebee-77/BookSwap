import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, ArrowLeftRight, ShieldAlert } from 'lucide-react';

interface SidebarItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const sidebarItems: SidebarItem[] = [
  { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'Users', path: '/admin/users', icon: <Users className="h-5 w-5" /> },
  { label: 'Books', path: '/admin/books', icon: <BookOpen className="h-5 w-5" /> },
  { label: 'Exchanges', path: '/admin/exchanges', icon: <ArrowLeftRight className="h-5 w-5" /> },
];

export const AdminSidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-card border-r border-border min-h-[calc(100vh-4rem)] hidden md:block">
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2 px-2 text-xs font-bold text-primary tracking-widest uppercase">
          <ShieldAlert className="h-4 w-4" />
          <span>Administration</span>
        </div>
        <nav className="space-y-1.5">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isActive
                    ? 'bg-primary/10 text-primary font-bold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
};
