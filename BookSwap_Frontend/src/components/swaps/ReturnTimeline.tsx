import React from 'react';
import { Check, Clock, ArrowLeftRight, RotateCcw, PackageCheck, CheckCircle2, XCircle } from 'lucide-react';
import type { ExchangeRequestStatus, ExchangeHistoryItem } from '../../types/swap';

interface ReturnTimelineProps {
  status: ExchangeRequestStatus;
  history?: ExchangeHistoryItem[];
  exchangeCreatedAt?: string;
  returnRequestedAt?: string | null;
  returnAcceptedAt?: string | null;
  returnDeclinedAt?: string | null;
  returnedAt?: string | null;
  confirmedAt?: string | null;
  returnMessage?: string | null;
}

interface StepItem {
  id: string;
  title: string;
  description: string;
  timestamp?: string | null;
  statusState: 'completed' | 'current' | 'upcoming' | 'declined';
  icon: React.ReactNode;
}

export const ReturnTimeline: React.FC<ReturnTimelineProps> = ({
  status,
  history = [],
  exchangeCreatedAt,
  returnRequestedAt,
  returnAcceptedAt,
  returnDeclinedAt,
  returnedAt,
  confirmedAt,
  returnMessage,
}) => {
  // Find timestamps from history if not passed directly
  const getHistoryTime = (types: string[]) => {
    const item = history.find((h) => types.includes(h.eventType));
    return item ? item.createdAt : null;
  };

  const tExchange = exchangeCreatedAt || getHistoryTime(['EXCHANGE_ACCEPTED', 'EXCHANGE_CREATED']);
  const tRequested = returnRequestedAt || getHistoryTime(['RETURN_REQUESTED']);
  const tAccepted = returnAcceptedAt || getHistoryTime(['RETURN_ACCEPTED', 'RETURN_STARTED']);
  const tDeclined = returnDeclinedAt || getHistoryTime(['RETURN_DECLINED']);
  const tReturned = returnedAt || getHistoryTime(['BOOK_RETURNED']);
  const tConfirmed = confirmedAt || getHistoryTime(['OWNER_CONFIRMED', 'EXCHANGE_COMPLETED']);

  // Build steps array
  const steps: StepItem[] = [
    {
      id: 'exchange',
      title: 'Book Exchanged',
      description: 'Exchange proposal was accepted and book was transferred.',
      timestamp: tExchange,
      statusState: 'completed',
      icon: <ArrowLeftRight className="h-4 w-4" />,
    },
    {
      id: 'requested',
      title: 'Return Requested',
      description: returnMessage ? `Owner requested return: "${returnMessage}"` : 'Original owner requested the book back.',
      timestamp: tRequested,
      statusState:
        tRequested || ['RETURN_REQUESTED', 'RETURN_ACCEPTED', 'RETURN_IN_PROGRESS', 'RETURNED', 'COMPLETED', 'RETURN_DECLINED'].includes(status)
          ? 'completed'
          : status === 'ACCEPTED'
          ? 'upcoming'
          : 'upcoming',
      icon: <RotateCcw className="h-4 w-4" />,
    },
  ];

  if (status === 'RETURN_DECLINED') {
    steps.push({
      id: 'declined',
      title: 'Return Request Declined',
      description: returnMessage ? `Holder response: "${returnMessage}"` : 'Current holder was unable to accept the return request.',
      timestamp: tDeclined,
      statusState: 'declined',
      icon: <XCircle className="h-4 w-4" />,
    });
  } else {
    steps.push({
      id: 'accepted',
      title: 'Return Accepted / In Progress',
      description: 'Holder accepted request; book is being prepared/sent for return.',
      timestamp: tAccepted,
      statusState:
        ['RETURN_ACCEPTED', 'RETURN_IN_PROGRESS', 'RETURNED', 'COMPLETED'].includes(status)
          ? 'completed'
          : status === 'RETURN_REQUESTED'
          ? 'current'
          : 'upcoming',
      icon: <Clock className="h-4 w-4" />,
    });

    steps.push({
      id: 'returned',
      title: 'Book Marked as Returned',
      description: 'Holder returned the book and marked it in the system.',
      timestamp: tReturned,
      statusState:
        ['RETURNED', 'COMPLETED'].includes(status)
          ? 'completed'
          : ['RETURN_ACCEPTED', 'RETURN_IN_PROGRESS'].includes(status)
          ? 'current'
          : 'upcoming',
      icon: <PackageCheck className="h-4 w-4" />,
    });

    steps.push({
      id: 'completed',
      title: 'Owner Confirmed & Completed',
      description: 'Owner confirmed receipt. Book ownership restored to original shelf.',
      timestamp: tConfirmed,
      statusState:
        status === 'COMPLETED'
          ? 'completed'
          : status === 'RETURNED'
          ? 'current'
          : 'upcoming',
      icon: <CheckCircle2 className="h-4 w-4" />,
    });
  }

  return (
    <div className="py-2">
      <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
        {steps.map((step, index) => {
          let nodeClasses = 'bg-muted text-muted-foreground border-border';
          if (step.statusState === 'completed') {
            nodeClasses = 'bg-emerald-500 text-white border-emerald-600 shadow-sm';
          } else if (step.statusState === 'current') {
            nodeClasses = 'bg-primary text-primary-foreground border-primary ring-4 ring-primary/20 animate-pulse';
          } else if (step.statusState === 'declined') {
            nodeClasses = 'bg-rose-500 text-white border-rose-600 shadow-sm';
          }

          return (
            <div key={step.id || index} className="relative group">
              {/* Timeline marker */}
              <div
                className={`absolute -left-6 top-0.5 flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold transition-all ${nodeClasses}`}
              >
                {step.statusState === 'completed' ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  step.icon
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 pl-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h4
                    className={`text-sm font-bold ${
                      step.statusState === 'completed'
                        ? 'text-foreground'
                        : step.statusState === 'current'
                        ? 'text-primary font-extrabold'
                        : step.statusState === 'declined'
                        ? 'text-destructive font-extrabold'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {step.title}
                  </h4>
                  {step.timestamp && (
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {new Date(step.timestamp).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
