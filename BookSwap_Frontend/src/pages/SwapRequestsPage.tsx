import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ArrowLeftRight, Inbox, Send, History, RotateCcw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { swapService } from '../services/swapService';
import { SwapRequestCard } from '../components/swaps/SwapRequestCard';
import { EmptySwapRequests } from '../components/swaps/EmptySwapRequests';
import type { ExchangeRequest } from '../types/swap';

type TabType = 'received' | 'sent' | 'history';

export const SwapRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('received');
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'ACTIVE_RETURNS' | 'COMPLETED'>('ALL');

  // Fetch only the authenticated user's participating exchange requests
  const { data: myRequestsRaw = [], isLoading } = useQuery({
    queryKey: ['my-swap-requests', user?.id],
    queryFn: () => swapService.getMyRequests(),
    enabled: !!user?.id,
  });

  // Deduplicate by ID
  const deduplicatedRequests = React.useMemo(() => {
    const map = new Map<number, ExchangeRequest>();
    myRequestsRaw.forEach((req) => {
      if (!map.has(req.id)) {
        map.set(req.id, req);
      }
    });
    return Array.from(map.values());
  }, [myRequestsRaw]);

  // 1. Received Pending Requests: The current user is the book owner and status is PENDING
  const pendingReceived = deduplicatedRequests.filter(
    (req) => req.status === 'PENDING' && req.ownerId === user?.id && req.requesterId !== user?.id
  );

  // 2. Sent Pending Requests: The current user is the requester and status is PENDING
  const pendingSent = deduplicatedRequests.filter(
    (req) => req.status === 'PENDING' && req.requesterId === user?.id
  );

  // 3. History: Any processed exchange involving user (ACCEPTED, REJECTED, RETURN_*, COMPLETED)
  const historyRequests = deduplicatedRequests
    .filter(
      (req) =>
        req.status !== 'PENDING' &&
        (req.requesterId === user?.id || req.ownerId === user?.id)
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Count active returns requiring attention
  const activeReturnsCount = historyRequests.filter(
    (req) =>
      req.status === 'RETURN_REQUESTED' ||
      req.status === 'RETURN_ACCEPTED' ||
      req.status === 'RETURN_IN_PROGRESS' ||
      req.status === 'RETURNED'
  ).length;

  const filteredHistory = historyRequests.filter((req) => {
    if (historyFilter === 'ACTIVE_RETURNS') {
      return (
        req.status === 'RETURN_REQUESTED' ||
        req.status === 'RETURN_ACCEPTED' ||
        req.status === 'RETURN_IN_PROGRESS' ||
        req.status === 'RETURNED'
      );
    }
    if (historyFilter === 'COMPLETED') {
      return req.status === 'COMPLETED';
    }
    return true;
  });

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
      label: 'Exchanges & Returns',
      icon: <History className="h-4 w-4" />,
      count: activeReturnsCount > 0 ? activeReturnsCount : undefined,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 bg-background">
      {/* Title Header */}
      <div className="border-b border-border pb-6 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl flex items-center gap-2">
          <ArrowLeftRight className="h-8 w-8 text-primary" />
          <span>Book Exchanges & Returns</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Review proposals, manage book loans, request books back, and confirm returns.
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
                <span
                  className={`inline-flex items-center justify-center rounded-full text-[10px] font-bold h-5 px-1.5 leading-none transition-colors ${
                    isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
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
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            Loading exchange logs...
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeTab === 'received' &&
            (pendingReceived.length === 0 ? (
              <EmptySwapRequests type="received" />
            ) : (
              <div className="space-y-4">
                {pendingReceived.map((req) => (
                  <SwapRequestCard key={req.id} request={req} />
                ))}
              </div>
            ))}

          {activeTab === 'sent' &&
            (pendingSent.length === 0 ? (
              <EmptySwapRequests type="sent" />
            ) : (
              <div className="space-y-4">
                {pendingSent.map((req) => (
                  <SwapRequestCard key={req.id} request={req} />
                ))}
              </div>
            ))}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {/* Sub-filter for history */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground">Filter History:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(['ALL', 'ACTIVE_RETURNS', 'COMPLETED'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setHistoryFilter(filter)}
                      className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${
                        historyFilter === filter
                          ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                          : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      {filter === 'ALL'
                        ? 'All History'
                        : filter === 'ACTIVE_RETURNS'
                        ? `Active Returns (${activeReturnsCount})`
                        : 'Completed Returns'}
                    </button>
                  ))}
                </div>
              </div>

              {filteredHistory.length === 0 ? (
                <EmptySwapRequests type="history" />
              ) : (
                <div className="space-y-4">
                  {filteredHistory.map((req) => (
                    <SwapRequestCard key={req.id} request={req} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
