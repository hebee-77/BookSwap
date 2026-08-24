import React from 'react';
import type { ExchangeRequestStatus } from '../../types/swap';

interface SwapStatusBadgeProps {
  status: ExchangeRequestStatus;
  className?: string;
}

export const SwapStatusBadge: React.FC<SwapStatusBadgeProps> = ({ status, className = '' }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'PENDING':
        return {
          label: 'Pending Swap',
          classes: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          dot: 'bg-amber-500',
        };
      case 'ACCEPTED':
        return {
          label: 'Exchanged',
          classes: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          dot: 'bg-emerald-500',
        };
      case 'REJECTED':
        return {
          label: 'Declined',
          classes: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
          dot: 'bg-rose-500',
        };
      case 'RETURN_REQUESTED':
        return {
          label: 'Return Requested',
          classes: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 animate-pulse',
          dot: 'bg-orange-500',
        };
      case 'RETURN_ACCEPTED':
      case 'RETURN_IN_PROGRESS':
        return {
          label: 'Return In Progress',
          classes: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
          dot: 'bg-sky-500',
        };
      case 'RETURN_DECLINED':
        return {
          label: 'Return Declined',
          classes: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20',
          dot: 'bg-zinc-500',
        };
      case 'RETURNED':
        return {
          label: 'Book Returned',
          classes: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 animate-pulse',
          dot: 'bg-purple-500',
        };
      case 'COMPLETED':
        return {
          label: 'Return Completed',
          classes: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
          dot: 'bg-teal-500',
        };
      default:
        return {
          label: status,
          classes: 'bg-muted text-muted-foreground border-border',
          dot: 'bg-muted-foreground',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${config.classes} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};
