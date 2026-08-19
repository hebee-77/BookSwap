import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { authService } from '../../services/authService';
import { bookService } from '../../services/bookService';
import { swapService } from '../../services/swapService';
import { AdminMetricCard } from '../../components/admin/AdminMetricCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Users, BookOpen, Clock, CheckCircle2, XCircle } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  // Query 1: Users
  const {
    data: users = [],
    isLoading: isLoadingUsers,
    isError: isErrorUsers,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => authService.getUsers(),
  });

  // Query 2: Books Count
  const {
    data: booksPageData,
    isLoading: isLoadingBooks,
    isError: isErrorBooks,
    refetch: refetchBooks,
  } = useQuery({
    queryKey: ['admin-books-count'],
    queryFn: () => bookService.getBooks({ page: 0, size: 1 }),
  });

  // Query 3: Exchanges
  const {
    data: exchanges = [],
    isLoading: isLoadingExchanges,
    isError: isErrorExchanges,
    refetch: refetchExchanges,
  } = useQuery({
    queryKey: ['admin-exchanges'],
    queryFn: () => swapService.getAllRequests(),
  });

  const totalUsers = users.length;
  const totalBooks = booksPageData?.totalElements || 0;

  // Derive exchanges
  const pendingCount = exchanges.filter((e) => e.status === 'PENDING').length;
  const acceptedCount = exchanges.filter((e) => e.status === 'ACCEPTED').length;
  const rejectedCount = exchanges.filter((e) => e.status === 'REJECTED').length;
  const totalExchanges = exchanges.length;

  // Calculate availability (Unique unavailable book IDs subtracted from total books)
  const acceptedBookIds = new Set(
    exchanges.filter((e) => e.status === 'ACCEPTED').map((e) => e.bookId)
  );
  const availableBooks = Math.max(0, totalBooks - acceptedBookIds.size);

  const isAnyLoading = isLoadingUsers || isLoadingBooks || isLoadingExchanges;
  const isAnyError = isErrorUsers || isErrorBooks || isErrorExchanges;

  const handleRefetchAll = () => {
    refetchUsers();
    refetchBooks();
    refetchExchanges();
  };

  if (isAnyError) {
    return (
      <div className="space-y-6">
        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-4 space-y-1 shadow-sm">
          <h4 className="font-bold text-sm">Failed to Load Dashboard Data</h4>
          <p className="text-xs">
            Could not communicate with the database or server. Make sure the backend server is running.
          </p>
        </div>
        <button
          onClick={handleRefetchAll}
          className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-sm shadow hover:opacity-90 transition-opacity"
        >
          Retry Loading Data
        </button>
      </div>
    );
  }

  // Calculate percentages
  const acceptedPercent = totalExchanges > 0 ? Math.round((acceptedCount / totalExchanges) * 100) : 0;
  const pendingPercent = totalExchanges > 0 ? Math.round((pendingCount / totalExchanges) * 100) : 0;
  const rejectedPercent = totalExchanges > 0 ? Math.round((rejectedCount / totalExchanges) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          High-level overview of the BookSwap platform operations and exchange analytics.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AdminMetricCard
          label="Total Users"
          value={totalUsers}
          icon={<Users className="h-5 w-5" />}
          description="Registered user accounts"
          isLoading={isAnyLoading}
        />
        <AdminMetricCard
          label="Total Books"
          value={totalBooks}
          icon={<BookOpen className="h-5 w-5" />}
          description="Uploaded books in database"
          isLoading={isAnyLoading}
        />
        <AdminMetricCard
          label="Available Books"
          value={availableBooks}
          icon={<CheckCircle2 className="h-5 w-5" />}
          description="Books free for exchange"
          isLoading={isAnyLoading}
        />
        <AdminMetricCard
          label="Pending Swaps"
          value={pendingCount}
          icon={<Clock className="h-5 w-5" />}
          description="Active negotiation requests"
          isLoading={isAnyLoading}
        />
        <AdminMetricCard
          label="Accepted Swaps"
          value={acceptedCount}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
          description="Completed book exchanges"
          isLoading={isAnyLoading}
        />
        <AdminMetricCard
          label="Rejected Swaps"
          value={rejectedCount}
          icon={<XCircle className="h-5 w-5 text-destructive" />}
          description="Declined exchange offers"
          isLoading={isAnyLoading}
        />
      </div>

      {/* Analytical Visual Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exchange Status Share */}
        <Card className="border border-border/80 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">Exchange Distribution</CardTitle>
            <CardDescription>
              Proportion of swap requests across statuses.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isAnyLoading ? (
              <div className="space-y-4">
                <div className="h-4 bg-muted animate-pulse rounded-md w-full" />
                <div className="h-4 bg-muted animate-pulse rounded-md w-full" />
                <div className="h-4 bg-muted animate-pulse rounded-md w-full" />
              </div>
            ) : totalExchanges === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground text-sm font-semibold">
                No exchange data available.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Accepted ProgressBar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-muted-foreground uppercase tracking-wider">Accepted</span>
                    <span className="text-foreground">{acceptedCount} ({acceptedPercent}%)</span>
                  </div>
                  <div className="w-full bg-muted h-3.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${acceptedPercent}%` }}
                    />
                  </div>
                </div>

                {/* Pending ProgressBar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-muted-foreground uppercase tracking-wider">Pending</span>
                    <span className="text-foreground">{pendingCount} ({pendingPercent}%)</span>
                  </div>
                  <div className="w-full bg-muted h-3.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pendingPercent}%` }}
                    />
                  </div>
                </div>

                {/* Rejected ProgressBar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-muted-foreground uppercase tracking-wider">Rejected</span>
                    <span className="text-foreground">{rejectedCount} ({rejectedPercent}%)</span>
                  </div>
                  <div className="w-full bg-muted h-3.5 rounded-full overflow-hidden">
                    <div
                      className="bg-destructive h-full rounded-full transition-all duration-500"
                      style={{ width: `${rejectedPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Platform Information Card */}
        <Card className="border border-border/80 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">Platform Activity Summary</CardTitle>
            <CardDescription>
              Overview of the exchange ratio and user activity levels.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAnyLoading ? (
              <div className="space-y-4">
                <div className="h-6 bg-muted animate-pulse rounded-md w-3/4" />
                <div className="h-6 bg-muted animate-pulse rounded-md w-1/2" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/30 border border-border/50 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Swaps per User
                  </span>
                  <p className="text-2xl font-extrabold text-foreground">
                    {totalUsers > 0 ? (totalExchanges / totalUsers).toFixed(1) : '0.0'}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-semibold">Average requests submitted</p>
                </div>
                <div className="p-4 bg-muted/30 border border-border/50 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Books per User
                  </span>
                  <p className="text-2xl font-extrabold text-foreground">
                    {totalUsers > 0 ? (totalBooks / totalUsers).toFixed(1) : '0.0'}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-semibold">Average uploads per member</p>
                </div>
              </div>
            )}
            <div className="text-xs text-muted-foreground font-medium bg-muted/20 p-3.5 border border-border/40 rounded-xl">
              💡 **Admin Note:** Book availability ratio is currently{' '}
              <strong className="text-foreground">
                {totalBooks > 0 ? Math.round((availableBooks / totalBooks) * 100) : 0}%
              </strong>
              . A higher availability ratio encourages better engagement for new users joining the swap pool.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
