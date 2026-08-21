import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, Check, X, BookOpen, ExternalLink, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/button';
import { swapService } from '../../services/swapService';
import { toast } from 'sonner';
import type { ExchangeContext } from '../../types/chat';
import { useAuth } from '../../hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

interface ExchangeBannerProps {
  exchange: ExchangeContext;
  onStatusUpdated?: () => void;
}

export const ExchangeBanner: React.FC<ExchangeBannerProps> = ({
  exchange,
  onStatusUpdated,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  const isOwner = user?.id === exchange.ownerId;
  const isPending = exchange.status === 'PENDING';

  const handleAccept = async () => {
    try {
      setIsUpdating(true);
      await swapService.acceptRequest(exchange.id);
      toast.success('Exchange request accepted!');
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['swap-requests'] });
      onStatusUpdated?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to accept exchange request');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsUpdating(true);
      await swapService.rejectRequest(exchange.id);
      toast.info('Exchange request declined');
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['swap-requests'] });
      onStatusUpdated?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to decline exchange request');
    } finally {
      setIsUpdating(false);
    }
  };

  const statusBadgeColor = {
    PENDING: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    ACCEPTED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    REJECTED: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  }[exchange.status] || 'bg-muted text-muted-foreground border-border';

  return (
    <div className="border-b border-border/80 bg-card/60 backdrop-blur px-4 py-3 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Book Information */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-12 w-9 rounded-md bg-muted border border-border/60 overflow-hidden shrink-0 flex items-center justify-center">
            {exchange.bookImageUrl ? (
              <img
                src={exchange.bookImageUrl}
                alt={exchange.bookTitle}
                className="h-full w-full object-cover"
              />
            ) : (
              <BookOpen className="h-4 w-4 text-muted-foreground/60" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <ArrowLeftRight className="h-3 w-3 text-primary" />
                Book Swap Context
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadgeColor}`}
              >
                {exchange.status}
              </span>
            </div>

            <h4 className="text-sm font-bold text-foreground truncate mt-0.5">
              {exchange.bookTitle}
            </h4>
            <p className="text-xs text-muted-foreground truncate">
              by {exchange.bookAuthor} • Condition: {exchange.bookCondition || 'Good'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center w-full sm:w-auto justify-end">
          <Link to={`/books/${exchange.bookId}`} target="_blank">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1 font-medium border-border/80 hover:bg-muted"
            >
              <ExternalLink className="h-3 w-3" />
              <span>View Book</span>
            </Button>
          </Link>

          {isOwner && isPending && (
            <>
              <Button
                size="sm"
                variant="destructive"
                className="h-8 text-xs gap-1 font-semibold"
                onClick={handleReject}
                disabled={isUpdating}
              >
                <X className="h-3.5 w-3.5" />
                <span>Decline</span>
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs gap-1 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={handleAccept}
                disabled={isUpdating}
              >
                <Check className="h-3.5 w-3.5" />
                <span>Accept</span>
              </Button>
            </>
          )}

          {!isOwner && isPending && (
            <span className="text-xs text-muted-foreground italic flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Awaiting owner response
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
