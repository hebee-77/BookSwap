import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { bookService } from '../services/bookService';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { LogOut, User as UserIcon, Calendar, BookOpen, Plus, Eye, Edit, ArrowLeftRight } from 'lucide-react';
import { swapService } from '../services/swapService';
import { notificationService } from '../services/notificationService';
import { BookCover } from '../components/books/BookCover';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  // Fetch books listed by the current user
  const { data: userBooksData, isLoading: isLoadingBooks } = useQuery({
    queryKey: ['user-books', user?.id],
    queryFn: () => bookService.getBooksByOwner(user!.id),
    enabled: !!user?.id,
  });

  const userBooks = userBooksData?.content || [];
  const totalBooksCount = userBooksData?.totalElements || 0;

  // Fetch all requests to filter pending received swaps
  const { data: allRequests = [], isLoading: isLoadingAllRequests } = useQuery({
    queryKey: ['swap-requests'],
    queryFn: () => swapService.getAllRequests(),
    enabled: !!user?.id,
  });

  const userBookIds = new Set(userBooks.map((b) => b.id));
  const pendingReceivedCount = allRequests.filter(
    (req) => req.status === 'PENDING' && userBookIds.has(req.bookId) && req.requesterId !== user?.id
  ).length;

  // Fetch recent notifications from backend
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications(),
    enabled: !!user?.id,
  });

  const recentNotifications = notifications.slice(0, 3);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 bg-background">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back, {user?.name || 'Reader'}!</p>
          </div>
          <div className="flex gap-3">
            <Link to="/books/new">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span>Add Book</span>
              </Button>
            </Link>
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">User Profile</CardTitle>
              <UserIcon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Full Name</p>
                <p className="text-base font-semibold text-foreground">{user?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email Address</p>
                <p className="text-sm text-foreground">{user?.email || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Shelf Summary</CardTitle>
              <BookOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Books Listed</p>
                <p className="text-2xl font-extrabold text-foreground mt-0.5">
                  {isLoadingBooks ? '...' : totalBooksCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Account Status</p>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500 mt-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active Swap Account
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Account Details</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">User ID</p>
                <p className="text-base font-semibold text-foreground">#{user?.id || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Member Since</p>
                <p className="text-sm text-foreground">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Swap Requests</CardTitle>
              <ArrowLeftRight className="h-4.5 w-4.5 text-primary" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Pending Received</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-2xl font-extrabold text-foreground">
                    {isLoadingAllRequests ? '...' : pendingReceivedCount}
                  </p>
                  {pendingReceivedCount > 0 && (
                    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Actions</p>
                <Link to="/swap-requests" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 mt-1">
                  <span>View Swap Requests</span>
                  <span>&rarr;</span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Panel */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Link to="/books/new">
            <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-all font-semibold">
              <Plus className="h-4.5 w-4.5 text-primary" />
              <span className="text-xs">Add a Book</span>
            </Button>
          </Link>
          <Link to="/my-books">
            <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-all font-semibold">
              <BookOpen className="h-4.5 w-4.5 text-primary" />
              <span className="text-xs">My Bookshelf</span>
            </Button>
          </Link>
          <Link to="/books">
            <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-all font-semibold">
              <Eye className="h-4.5 w-4.5 text-primary" />
              <span className="text-xs">Browse Shelf</span>
            </Button>
          </Link>
          <Link to="/swap-requests">
            <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-all font-semibold">
              <ArrowLeftRight className="h-4.5 w-4.5 text-primary" />
              <span className="text-xs">Swap Requests</span>
            </Button>
          </Link>
        </div>

        {/* Two-Column Grid: Books List & Recent Activity */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column: Your Listed Books */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-foreground">Your Listed Books</CardTitle>
                <CardDescription>
                  Manage and track the status of the books you've listed on BookSwap.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingBooks ? (
                  <div className="space-y-3 py-4">
                    <div className="h-10 bg-muted rounded animate-pulse w-full" />
                    <div className="h-10 bg-muted rounded animate-pulse w-full" />
                  </div>
                ) : userBooks.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-border rounded-xl bg-muted/10">
                    <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/60 mb-3" />
                    <h4 className="font-semibold text-foreground">Your shelf is empty</h4>
                    <p className="text-xs text-muted-foreground mt-1 mb-4">
                      You haven't listed any books for exchange yet.
                    </p>
                    <Link to="/books/new">
                      <Button size="sm" className="flex items-center gap-1.5">
                        <Plus className="h-4 w-4" />
                        <span>List your first book</span>
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="min-w-full divide-y divide-border text-sm">
                      <thead className="bg-muted/50 font-semibold text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 text-left">Title</th>
                          <th className="px-4 py-3 text-left">Author</th>
                          <th className="px-4 py-3 text-left">Condition</th>
                          <th className="px-4 py-3 text-left">Status</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-card text-foreground">
                        {userBooks.map((book) => (
                          <tr key={book.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 font-medium max-w-[240px]">
                              <div className="flex items-center gap-2.5">
                                <div className="h-10 w-7 shrink-0">
                                  <BookCover imageUrl={book.imageUrl} title={book.title} aspect="portrait" size="xs" className="h-10 w-7" />
                                </div>
                                <span className="truncate">{book.title}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{book.author}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold uppercase bg-muted text-muted-foreground">
                                {book.bookCondition}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${book.available ? 'text-emerald-600' : 'text-rose-500'}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${book.available ? 'bg-emerald-500' : 'bg-rose-400'}`} />
                                {book.available ? 'Available' : 'Swapped'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Link to={`/books/${book.id}`}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Link to={`/books/${book.id}/edit`}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Recent Activity */}
          <div className="lg:col-span-1">
            <Card className="border border-border bg-card h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-foreground">Recent Activity</CardTitle>
                <CardDescription>
                  Real-time exchange updates.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                {recentNotifications.length === 0 ? (
                  <div className="text-center py-12 text-sm text-muted-foreground">
                    No recent activity logs.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentNotifications.map((notif) => (
                      <Link
                        key={notif.id}
                        to="/swap-requests"
                        className="block p-3 rounded-xl border border-border bg-card/50 hover:bg-muted/40 transition-colors space-y-1"
                      >
                        <div className="flex justify-between items-start gap-1.5">
                          <span className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${
                            notif.type === 'SWAP_REQUEST' ? 'bg-blue-500' : notif.type === 'REQUEST_ACCEPTED' ? 'bg-emerald-500' : 'bg-rose-400'
                          }`} />
                          <p className="text-xs text-foreground font-semibold flex-1 leading-normal line-clamp-2">
                            {notif.message}
                          </p>
                        </div>
                        <span className="text-[10px] text-muted-foreground block pl-3.5">
                          {new Date(notif.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
              <div className="border-t border-border p-4 bg-muted/10 text-center mt-auto">
                <Link
                  to="/notifications"
                  className="text-xs font-bold text-primary hover:underline"
                >
                  View all activity &rarr;
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
