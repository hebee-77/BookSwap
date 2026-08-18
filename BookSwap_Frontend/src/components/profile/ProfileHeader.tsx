import React from 'react';
import { ShieldCheck, Calendar, Mail } from 'lucide-react';
import type { User } from '../../types/user';

interface ProfileHeaderProps {
  user: User;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user }) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="flex flex-col md:flex-row items-center gap-6 p-6 border border-border rounded-2xl bg-card shadow-sm">
      {/* Avatar Initials Bubble */}
      <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-3xl font-extrabold shadow-inner border border-primary/20">
        {getInitials(user.name)}
      </div>

      {/* User Info Details */}
      <div className="flex-1 space-y-3.5 text-center md:text-left min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center md:justify-start">
          <h2 className="text-2xl font-bold tracking-tight text-foreground truncate">{user.name}</h2>
          <span className="inline-flex items-center gap-1 self-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 border border-emerald-500/20 shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Active Member</span>
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-center md:justify-start text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5 justify-center md:justify-start">
            <Mail className="h-4 w-4 text-muted-foreground/70" />
            <span className="truncate">{user.email}</span>
          </div>
          
          <div className="flex items-center gap-1.5 justify-center md:justify-start">
            <Calendar className="h-4 w-4 text-muted-foreground/70" />
            <span>Member since {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Quick metadata badges */}
      <div className="flex items-center gap-2.5 md:border-l md:border-border md:pl-6 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-muted-foreground/60">ID Number</span>
          <span className="text-sm font-bold text-foreground mt-0.5">#{user.id}</span>
        </div>
      </div>
    </div>
  );
};
