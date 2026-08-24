import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeftRight,
  Check,
  X,
  BookOpen,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  PackageCheck,
  CheckCircle2,
  History,
} from 'lucide-react';
import { Button } from '../ui/button';
import { swapService } from '../../services/swapService';
import { toast } from 'sonner';
import type { ExchangeContext } from '../../types/chat';
import { useAuth } from '../../hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { SwapStatusBadge } from '../swaps/SwapStatusBadge';
import { ReturnActionDialog, type ReturnActionType } from '../swaps/ReturnActionDialog';
import { ReturnDetailsModal } from '../swaps/ReturnDetailsModal';

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
  const [returnAction, setReturnAction] = useState<ReturnActionType | null>(null);
  const [showTimelineModal, setShowTimelineModal] = useState(false);

  const isOwner = user?.id === exchange.ownerId;
  const isHolder = user?.id === exchange.requesterId;
  const isPending = exchange.status === 'PENDING';

  const handleAcceptSwap = async () => {
    try {
      setIsUpdating(true);
      await swapService.acceptRequest(exchange.id);
      toast.success('Exchange request accepted! Book transferred.');
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['swap-requests'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['user-books'] });
      onStatusUpdated?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to accept exchange request');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRejectSwap = async () => {
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
                Swap Context
              </span>
              <SwapStatusBadge status={exchange.status} />
            </div>

            <h4 className="text-sm font-bold text-foreground truncate mt-0.5">
              {exchange.bookTitle}
              {exchange.offeredBookTitle && (
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  ↔ offered: <span className="font-semibold text-foreground">{exchange.offeredBookTitle}</span>
                </span>
              )}
            </h4>
            <p className="text-xs text-muted-foreground truncate">
              by {exchange.bookAuthor} • Condition: {exchange.bookCondition || 'Good'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-center w-full sm:w-auto justify-end">
          <Link to={`/books/${exchange.bookId}`} target="_blank">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1 font-medium border-border/80 hover:bg-muted"
            >
              <ExternalLink className="h-3 w-3" />
              <span>Book</span>
            </Button>
          </Link>

          {/* Timeline View button */}
          {exchange.status !== 'PENDING' && exchange.status !== 'REJECTED' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTimelineModal(true)}
              className="h-8 text-xs gap-1 font-medium border-border/80 hover:bg-muted"
            >
              <History className="h-3 w-3 text-primary" />
              <span>Timeline</span>
            </Button>
          )}

          {/* Pending Exchange Acceptance */}
          {isOwner && isPending && (
            <>
              <Button
                size="sm"
                variant="destructive"
                className="h-8 text-xs gap-1 font-semibold"
                onClick={handleRejectSwap}
                disabled={isUpdating}
              >
                <X className="h-3.5 w-3.5" />
                <span>Decline</span>
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs gap-1 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={handleAcceptSwap}
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

          {/* Return Workflow Actions in Chat */}
          {isOwner && (exchange.status === 'ACCEPTED' || exchange.status === 'RETURN_DECLINED') && (
            <Button
              size="sm"
              onClick={() => setReturnAction('request_return')}
              className="h-8 text-xs gap-1 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Request Back</span>
            </Button>
          )}

          {isHolder && exchange.status === 'RETURN_REQUESTED' && (
            <>
              <Button
                size="sm"
                onClick={() => setReturnAction('accept_return')}
                className="h-8 text-xs gap-1 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Accept Return</span>
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setReturnAction('decline_return')}
                className="h-8 text-xs gap-1 font-semibold"
              >
                <X className="h-3.5 w-3.5" />
                <span>Decline</span>
              </Button>
            </>
          )}

          {isHolder && (exchange.status === 'RETURN_ACCEPTED' || exchange.status === 'RETURN_IN_PROGRESS') && (
            <Button
              size="sm"
              onClick={() => setReturnAction('mark_returned')}
              className="h-8 text-xs gap-1 font-semibold bg-purple-600 hover:bg-purple-700 text-white"
            >
              <PackageCheck className="h-3.5 w-3.5" />
              <span>Mark as Returned</span>
            </Button>
          )}

          {isOwner && exchange.status === 'RETURNED' && (
            <Button
              size="sm"
              onClick={() => setReturnAction('confirm_received')}
              className="h-8 text-xs gap-1 font-semibold bg-teal-600 hover:bg-teal-700 text-white"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Confirm Receipt</span>
            </Button>
          )}
        </div>
      </div>

      {/* Return Action Dialog */}
      {returnAction && (
        <ReturnActionDialog
          isOpen={!!returnAction}
          onClose={() => setReturnAction(null)}
          exchangeId={exchange.id}
          bookTitle={exchange.bookTitle}
          actionType={returnAction}
          onSuccess={() => {
            onStatusUpdated?.();
          }}
        />
      )}

      {/* Timeline Modal */}
      {showTimelineModal && (
        <ReturnDetailsModal
          isOpen={showTimelineModal}
          onClose={() => setShowTimelineModal(false)}
          exchangeId={exchange.id}
        />
      )}
    </div>
  );
};
