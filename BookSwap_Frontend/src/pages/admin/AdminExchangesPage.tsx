import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { swapService } from '../../services/swapService';
import { authService } from '../../services/authService';
import { bookService } from '../../services/bookService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { SwapStatusBadge } from '../../components/swaps/SwapStatusBadge';
import { ArrowLeftRight, Calendar, User, BookOpen, X, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Row/Card Child Item Component to resolve book details on demand
interface ExchangeRowProps {
  request: any;
  userMap: Map<number, any>;
  onViewDetails: (request: any) => void;
}

const ExchangeRow: React.FC<ExchangeRowProps> = ({ request, userMap, onViewDetails }) => {
  const requester = userMap.get(request.requesterId);

  // Fetch book details
  const { data: book, isLoading: isLoadingBook } = useQuery({
    queryKey: ['book', request.bookId],
    queryFn: () => bookService.getBookById(request.bookId),
  });

  const owner = book ? userMap.get(book.ownerId) : null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <>
      {/* Desktop Row View */}
      <tr className="hover:bg-muted/30 transition-colors group hidden md:table-row">
        <td className="py-3.5 px-4 font-bold text-foreground">#{request.id}</td>
        <td className="py-3.5 px-4">
          <div className="min-w-0">
            <p className="font-bold text-foreground truncate">
              {requester ? requester.name : `User #${request.requesterId}`}
            </p>
            <p className="text-[10px] text-muted-foreground font-semibold truncate">
              {requester ? requester.email : ''}
            </p>
          </div>
        </td>
        <td className="py-3.5 px-4">
          {isLoadingBook ? (
            <div className="h-4 bg-muted animate-pulse rounded w-32" />
          ) : book ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <BookOpen className="h-4 w-4 text-primary shrink-0" />
              <p className="font-semibold text-foreground truncate">{book.title}</p>
            </div>
          ) : (
            <p className="text-destructive font-medium text-xs">Book Deleted</p>
          )}
        </td>
        <td className="py-3.5 px-4">
          <div className="min-w-0">
            <p className="font-bold text-foreground truncate">
              {owner ? owner.name : book ? `User #${book.ownerId}` : 'N/A'}
            </p>
            <p className="text-[10px] text-muted-foreground font-semibold truncate">
              {owner ? owner.email : ''}
            </p>
          </div>
        </td>
        <td className="py-3.5 px-4">
          <div className="inline-block transform scale-90 origin-left">
            <SwapStatusBadge status={request.status} />
          </div>
        </td>
        <td className="py-3.5 px-4 text-muted-foreground font-semibold">{formatDate(request.createdAt)}</td>
        <td className="py-3.5 px-4 text-right">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(request)}
            className="h-8 gap-1.5 text-xs font-semibold hover:text-primary hover:bg-primary/10 rounded-lg opacity-80 group-hover:opacity-100 transition-opacity"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Details</span>
          </Button>
        </td>
      </tr>

      {/* Mobile Card View */}
      <div className="md:hidden p-4 rounded-xl border border-border bg-card/65 space-y-3.5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-muted-foreground">ID #{request.id}</span>
            <span className="text-[10px] text-muted-foreground/60">•</span>
            <span className="text-[10px] text-muted-foreground font-semibold">{formatDate(request.createdAt)}</span>
          </div>
          <div className="transform scale-85 origin-right">
            <SwapStatusBadge status={request.status} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40 text-xs">
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-muted-foreground uppercase">Requester</span>
            <p className="font-bold text-foreground truncate">{requester ? requester.name : `User #${request.requesterId}`}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-muted-foreground uppercase">Requested Book</span>
            {isLoadingBook ? (
              <div className="h-3.5 bg-muted animate-pulse rounded w-20 mt-1" />
            ) : book ? (
              <p className="font-semibold text-foreground truncate">{book.title}</p>
            ) : (
              <p className="text-destructive font-medium">Deleted</p>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-border/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(request)}
            className="h-8 gap-1.5 text-xs font-bold hover:text-primary hover:bg-primary/10 rounded-lg"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Details</span>
          </Button>
        </div>
      </div>
    </>
  );
};

export const AdminExchangesPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED'>('ALL');
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  // Query 1: Exchange Requests
  const { data: exchanges = [], isLoading: isLoadingExchanges, isError: isErrorExchanges } = useQuery({
    queryKey: ['admin-exchanges'],
    queryFn: () => swapService.getAllRequests(),
  });

  // Query 2: Users (to map requesterId and ownerId)
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => authService.getUsers(),
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  // Selected swap details helper queries
  const { data: selectedBook } = useQuery({
    queryKey: ['book', selectedRequest?.bookId],
    queryFn: () => bookService.getBookById(selectedRequest.bookId),
    enabled: !!selectedRequest?.bookId,
  });

  const selectedRequester = selectedRequest ? userMap.get(selectedRequest.requesterId) : null;
  const selectedOwner = selectedBook ? userMap.get(selectedBook.ownerId) : null;

  // Filter exchanges
  const filteredExchanges = exchanges.filter(
    (ex) => statusFilter === 'ALL' || ex.status === statusFilter
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getConditionStyles = (condition: string) => {
    switch (condition) {
      case 'NEW':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'GOOD':
        return 'bg-sky-500/10 text-sky-600 border-sky-500/20';
      case 'FAIR':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'POOR':
        return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Platform Exchanges</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Monitor and track book swap proposals and statuses across the platform.
        </p>
      </div>

      <Card className="border border-border/80 shadow-md">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-foreground">Swap Requests History</CardTitle>
              <CardDescription>
                Exchanges are moderated from a read-only perspective to ensure data consistency.
              </CardDescription>
            </div>

            {/* Status Tabs/Buttons */}
            <div className="flex border border-border bg-muted/40 p-1 rounded-xl">
              {(['ALL', 'PENDING', 'ACCEPTED', 'REJECTED'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    statusFilter === status
                      ? 'bg-background text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {status === 'ALL' ? 'All Swaps' : status}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingExchanges || isLoadingUsers ? (
            <div className="space-y-3 py-4">
              {[...Array(5)].map((_, idx) => (
                <div key={idx} className="h-14 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : isErrorExchanges ? (
            <div className="py-8 text-center text-sm font-semibold text-destructive">
              Error loading platform exchanges. Please try again.
            </div>
          ) : filteredExchanges.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm font-semibold">
              No exchange requests found with status: {statusFilter}.
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="py-3.5 px-4">Request ID</th>
                      <th className="py-3.5 px-4">Requester</th>
                      <th className="py-3.5 px-4">Requested Book</th>
                      <th className="py-3.5 px-4">Book Owner</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Created Date</th>
                      <th className="py-3.5 px-4 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredExchanges.map((req) => (
                      <ExchangeRow
                        key={req.id}
                        request={req}
                        userMap={userMap}
                        onViewDetails={(r) => setSelectedRequest(r)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card stack */}
              <div className="md:hidden space-y-3">
                {filteredExchanges.map((req) => (
                  <ExchangeRow
                    key={req.id}
                    request={req}
                    userMap={userMap}
                    onViewDetails={(r) => setSelectedRequest(r)}
                  />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Exchange Details Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRequest(null)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative w-full max-w-lg bg-card border border-border shadow-xl rounded-2xl overflow-hidden z-10"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="h-5 w-5 text-primary" />
                  <span className="font-extrabold text-foreground tracking-tight">Exchange Request Details</span>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5.5 max-h-[calc(100vh-12rem)] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border/60">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Request ID</span>
                    <p className="text-sm font-semibold text-foreground">#{selectedRequest.id}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</span>
                    <div className="mt-0.5">
                      <SwapStatusBadge status={selectedRequest.status} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Requester Profile */}
                  <div className="p-4 bg-muted/30 border border-border/50 rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 text-primary">
                      <User className="h-4 w-4" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider">Requester</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {selectedRequester ? selectedRequester.name : `User #${selectedRequest.requesterId}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {selectedRequester ? selectedRequester.email : 'Email Unavailable'}
                      </p>
                    </div>
                  </div>

                  {/* Owner Profile */}
                  <div className="p-4 bg-muted/30 border border-border/50 rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 text-primary">
                      <User className="h-4 w-4" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider">Owner</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {selectedOwner ? selectedOwner.name : selectedBook ? `User #${selectedBook.ownerId}` : 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {selectedOwner ? selectedOwner.email : 'Email Unavailable'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Requested Book Details */}
                <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl space-y-3">
                  <div className="flex items-center gap-1.5 text-primary">
                    <BookOpen className="h-4.5 w-4.5" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">Requested Book</span>
                  </div>
                  {selectedBook ? (
                    <div className="space-y-2.5">
                      <div>
                        <h4 className="font-extrabold text-foreground text-sm">{selectedBook.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">by {selectedBook.author}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${getConditionStyles(selectedBook.bookCondition)}`}>
                          {selectedBook.bookCondition}
                        </span>
                        {selectedBook.isbn && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-border text-[9px] font-bold text-muted-foreground">
                            ISBN: {selectedBook.isbn}
                          </span>
                        )}
                      </div>
                      {selectedBook.description && (
                        <p className="text-xs text-muted-foreground border-t border-border/40 pt-2 line-clamp-3 leading-relaxed">
                          {selectedBook.description}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs font-semibold text-destructive">Book details unavailable (deleted from catalog).</p>
                  )}
                </div>

                {/* Date Created */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold justify-center py-1">
                  <Calendar className="h-4 w-4" />
                  <span>Proposed on {formatDate(selectedRequest.createdAt)}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-muted/20 border-t border-border flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setSelectedRequest(null)} className="font-semibold">
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
