import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authService } from '../../services/authService';
import { bookService } from '../../services/bookService';
import { swapService } from '../../services/swapService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Search, Eye, X, BookOpen, ArrowLeftRight, User, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminUsersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Fetch users
  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => authService.getUsers(),
  });

  // Fetch all requests to calculate user activity stats
  const { data: exchanges = [] } = useQuery({
    queryKey: ['admin-exchanges'],
    queryFn: () => swapService.getAllRequests(),
    enabled: !!selectedUserId, // only load when modal details are requested
  });

  // Fetch books of the selected user for modal details
  const { data: userBooksData, isLoading: isLoadingUserBooks } = useQuery({
    queryKey: ['admin-owner-books', selectedUserId],
    queryFn: () => bookService.getBooksByOwner(selectedUserId!),
    enabled: !!selectedUserId,
  });

  const selectedUser = users.find((u) => u.id === selectedUserId);
  const userBooks = userBooksData?.content || [];
  const outgoingCount = selectedUserId
    ? exchanges.filter((e) => e.requesterId === selectedUserId).length
    : 0;

  // Filter users client-side
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Platform Users</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Monitor and view registered BookSwap community accounts.
        </p>
      </div>

      <Card className="border border-border/80 shadow-md">
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-foreground">Accounts Directory</CardTitle>
              <CardDescription>
                Search user registries. Account creation modifications are managed securely via auth services.
              </CardDescription>
            </div>
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9.5 pr-4 py-2 text-sm bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3 py-4">
              {[...Array(5)].map((_, idx) => (
                <div key={idx} className="h-12 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : isError ? (
            <div className="py-8 text-center text-sm font-semibold text-destructive">
              Error retrieving user directory. Please try again.
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm font-semibold">
              No users found matching search query.
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="py-3.5 px-4">User ID</th>
                      <th className="py-3.5 px-4">Name</th>
                      <th className="py-3.5 px-4">Email</th>
                      <th className="py-3.5 px-4">Created Date</th>
                      <th className="py-3.5 px-4 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-muted/30 transition-colors group">
                        <td className="py-3.5 px-4 font-semibold text-foreground">#{user.id}</td>
                        <td className="py-3.5 px-4 font-bold text-foreground">{user.name}</td>
                        <td className="py-3.5 px-4 text-muted-foreground">{user.email}</td>
                        <td className="py-3.5 px-4 text-muted-foreground">{formatDate(user.createdAt)}</td>
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedUserId(user.id)}
                            className="h-8 gap-1.5 text-xs font-semibold hover:text-primary hover:bg-primary/10 rounded-lg opacity-80 group-hover:opacity-100 transition-opacity"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="md:hidden space-y-3">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="p-4 rounded-xl border border-border bg-card/65 space-y-3.5"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-foreground leading-tight">{user.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                      </div>
                      <span className="text-xs font-bold text-muted-foreground">#{user.id}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border/40">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">
                        Joined: {formatDate(user.createdAt)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedUserId(user.id)}
                        className="h-8 gap-1.5 text-xs font-bold hover:text-primary hover:bg-primary/10 rounded-lg"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Details</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* User Details Modal */}
      <AnimatePresence>
        {selectedUserId && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUserId(null)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative w-full max-w-md bg-card border border-border shadow-xl rounded-2xl overflow-hidden z-10"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <span className="font-extrabold text-foreground tracking-tight">Account Details</span>
                </div>
                <button
                  onClick={() => setSelectedUserId(null)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border/60">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">User ID</span>
                    <p className="text-sm font-semibold text-foreground">#{selectedUser.id}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">User Role</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <ShieldAlert className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-bold text-foreground">
                        {selectedUser.email === 'admin@example.com' || selectedUser.email.toLowerCase().includes('admin')
                          ? 'Administrator'
                          : 'Standard Member'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Display Name</span>
                    <p className="text-sm font-bold text-foreground">{selectedUser.name}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email Address</span>
                    <p className="text-sm font-semibold text-foreground select-all">{selectedUser.email}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Registration Date</span>
                    <p className="text-sm font-semibold text-foreground">{formatDate(selectedUser.createdAt)}</p>
                  </div>
                </div>

                {/* Derived statistics */}
                <div className="border-t border-border pt-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-3">
                    Activity statistics
                  </span>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted/40 border border-border/50 rounded-xl flex items-center gap-2.5">
                      <BookOpen className="h-4.5 w-4.5 text-primary shrink-0" />
                      <div className="min-w-0">
                        {isLoadingUserBooks ? (
                          <div className="h-5 w-8 bg-muted animate-pulse rounded-md" />
                        ) : (
                          <span className="text-base font-extrabold text-foreground">{userBooks.length}</span>
                        )}
                        <p className="text-[9px] font-bold text-muted-foreground uppercase mt-0.5">Books listed</p>
                      </div>
                    </div>
                    <div className="p-3 bg-muted/40 border border-border/50 rounded-xl flex items-center gap-2.5">
                      <ArrowLeftRight className="h-4.5 w-4.5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <span className="text-base font-extrabold text-foreground">{outgoingCount}</span>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase mt-0.5">Swaps requested</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-muted/20 border-t border-border flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setSelectedUserId(null)} className="font-semibold">
                  Close Details
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
