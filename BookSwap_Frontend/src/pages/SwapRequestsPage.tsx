import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ArrowLeftRight, Inbox, Send, History } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { swapService } from '../services/swapService';
import { bookService } from '../services/bookService';
import { SwapRequestCard } from '../components/swaps/SwapRequestCard';
import { EmptySwapRequests } from '../components/swaps/EmptySwapRequests';

type TabType = 'received' | 'sent' | 'history';

export const SwapRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('received');

  // Fetch all requests in the system
  const { data: allRequests = [], isLoading: isLoadingAll } = useQuery({
    queryKey: ['swap-requests'],
    queryFn: () => swapService.getAllRequests(),
    enabled: !!user?.id,
  });

  // Fetch sent requests directly
  const { data: sentRequests = [], isLoading: isLoadingSent } = useQuery({
    queryKey: ['sent-swaps', user?.id],
    queryFn: () => swapService.getRequestsByRequester(user!.id),
    enabled: !!user?.id,
  });

  // Fetch user's own books to filter incoming requests
  const { data: userBooksData, isLoading: isLoadingUserBooks } = useQuery({
    queryKey: ['user-books', user?.id],
    queryFn: () => bookService.getBooksByOwner(user!.id),
    enabled: !!user?.id,
  });

  const userBooks = userBooksData?.content || [];
  const userBookIds = new Set(userBooks.map((b) => b.id));

  // Incoming requests: requests where book belongs to current user's library
  const receivedRequests = allRequests.filter(
    (req) => userBookIds.has(req.bookId) && req.requesterId !== user?.id
  );

  // Split into pending and history
  const pendingReceived = receivedRequests.filter((req) => req.status === 'PENDING');
  const pendingSent = sentRequests.filter((req) => req.status === 'PENDING');

  // History: any swap involving user that is accepted/rejected
  const historyRequests = [
    ...receivedRequests.filter((req) => req.status !== 'PENDING'),
    ...sentRequests.filter((req) => req.status !== 'PENDING'),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const isLoading = isLoadingAll || isLoadingSent || isLoadingUserBooks;

  const tabItems: { id: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
    {
      id: 'received',
      label: 'Received Requests',
      icon: <Inbox className="h-4 w-4" />,
      count: pendingReceived.length,
    },
    {
      id: 'sent',
      label: 'Sent Requests',
      icon: <Send className="h-4 w-4" />,
      count: pendingSent.length,
    },
    {
      id: 'history',
      label: 'Exchange History',
      icon: <History className="h-4 w-4" />,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 bg-background">
      {/* Title Header */}
      <div className="border-b border-border pb-6 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl flex items-center gap-2">
          <ArrowLeftRight className="h-8 w-8 text-primary" />
          <span>Book Exchanges</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Review, propose, and track your active book swaps.
        </p>
      </div>

      {/* Custom Navigation Tabs */}
      <div className="flex border-b border-border mb-6">
        {tabItems.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all focus:outline-none ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`inline-flex items-center justify-center rounded-full text-[10px] font-bold h-5 px-1.5 leading-none transition-colors ${
                  isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading exchange logs...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeTab === 'received' && (
            pendingReceived.length === 0 ? (
              <EmptySwapRequests type="received" />
            ) : (
              <div className="space-y-4">
                {pendingReceived.map((req) => (
                  <SwapRequestCard key={req.id} request={req} />
                ))}
              </div>
            )
          )}

          {activeTab === 'sent' && (
            pendingSent.length === 0 ? (
              <EmptySwapRequests type="sent" />
            ) : (
              <div className="space-y-4">
                {pendingSent.map((req) => (
                  <SwapRequestCard key={req.id} request={req} />
                ))}
              </div>
            )
          )}

          {activeTab === 'history' && (
            historyRequests.length === 0 ? (
              <EmptySwapRequests type="history" />
            ) : (
              <div className="space-y-4">
                {historyRequests.map((req) => (
                  <SwapRequestCard key={req.id} request={req} />
                ))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};
