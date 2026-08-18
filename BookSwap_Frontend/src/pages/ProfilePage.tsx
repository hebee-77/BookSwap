import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { bookService } from '../services/bookService';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { BookOpen, BookCheck } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  // Fetch own books count for display metrics
  const { data: userBooksData, isLoading: isLoadingBooks } = useQuery({
    queryKey: ['user-books', user?.id],
    queryFn: () => bookService.getBooksByOwner(user!.id),
    enabled: !!user?.id,
  });

  const userBooks = userBooksData?.content || [];
  const totalBooks = userBooksData?.totalElements || 0;
  const availableBooks = userBooks.filter((b) => b.available).length;
  const swappedBooks = totalBooks - availableBooks;

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 bg-background space-y-8 animate-fade-in">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Account Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your credentials and view activity logs.</p>
      </div>

      {/* Profile Header Details Component */}
      <ProfileHeader user={user} />

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Shelf</CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold text-foreground">{isLoadingBooks ? '...' : totalBooks}</p>
            <p className="text-xs text-muted-foreground mt-1">Books added to public database</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Available</CardTitle>
            <BookCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold text-foreground">{isLoadingBooks ? '...' : availableBooks}</p>
            <p className="text-xs text-muted-foreground mt-1">Open for community trades</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Swapped</CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold text-foreground">{isLoadingBooks ? '...' : swappedBooks}</p>
            <p className="text-xs text-muted-foreground mt-1">Completed exchanges</p>
          </CardContent>
        </Card>
      </div>

      {/* Read Only notice */}
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-foreground">Profile Information</CardTitle>
          <CardDescription>
            Personal registration logs. Edit capabilities are disabled by the server administration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-border pb-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">User ID</span>
              <p className="text-sm font-semibold text-foreground">#{user.id}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Roles & Authority</span>
              <p className="text-sm font-semibold text-foreground">Community Client Member</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Display Name</span>
              <p className="text-sm font-semibold text-foreground">{user.name}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</span>
              <p className="text-sm font-semibold text-foreground">{user.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
