import React from 'react';
import type { ExchangeRequestStatus } from '../../types/swap';

interface SwapStatusBadgeProps {
  status: ExchangeRequestStatus;
}

export const SwapStatusBadge: React.FC<SwapStatusBadgeProps> = ({ status }) => {
  const getStyles = () => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'ACCEPTED':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'REJECTED':
        return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${getStyles()}`}>
      {status}
    </span>
  );
};
