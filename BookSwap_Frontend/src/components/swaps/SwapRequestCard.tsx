import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  BookMarked,
  ArrowLeftRight,
  User,
  Calendar,
  Check,
  X,
  AlertTriangle,
  MessageSquare,
  Star,
  RotateCcw,
  PackageCheck,
  CheckCircle2,
  History,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { bookService } from '../../services/bookService';
import { swapService } from '../../services/swapService';
import { chatService } from '../../services/chatService';
import type { ExchangeRequest } from '../../types/swap';
import { SwapStatusBadge } from './SwapStatusBadge';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { reviewService } from '../../services/reviewService';
import { ReviewDialog } from '../reviews/ReviewDialog';
import { BookCover } from '../books/BookCover';
import { ReturnActionDialog, type ReturnActionType } from './ReturnActionDialog';
import { ReturnDetailsModal } from './ReturnDetailsModal';
import { ReturnOtpGenerateDialog } from './ReturnOtpGenerateDialog';
import { ReturnOtpVerifyDialog } from './ReturnOtpVerifyDialog';

interface SwapRequestCardProps {
  request: ExchangeRequest;
}

export const SwapRequestCard: React.FC<SwapRequestCardProps> = ({ request }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showConfirm, setShowConfirm] = useState<'accept' | 'reject' | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [returnAction, setReturnAction] = useState<ReturnActionType | null>(null);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [showGenerateOtp, setShowGenerateOtp] = useState(false);
  const [showVerifyOtp, setShowVerifyOtp] = useState(false);

  // Fetch reviews written by the user to check eligibility
  const { data: myReviews = [] } = useQuery({
    queryKey: ['my-reviews'],
    queryFn: () => reviewService.getMyReviews(),
    enabled: !!user?.id,
  });

  // Fetch details for the requested book
  const { data: requestedBook, isLoading: isLoadingReqBook } = useQuery({
    queryKey: ['book', request.bookId],
    queryFn: () => bookService.getBookById(request.bookId),
  });

  // Fetch offered book by offeredBookId if present
  const { data: offeredBook, isLoading: isLoadingOfferedBook } = useQuery({
    queryKey: ['book', request.offeredBookId],
    queryFn: () => bookService.getBookById(request.offeredBookId!),
    enabled: !!request.offeredBookId,
  });


  const acceptMutation = useMutation({
    mutationFn: () => swapService.acceptRequest(request.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swap-requests'] });
      queryClient.invalidateQueries({ queryKey: ['sent-swaps'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['user-books'] });
      queryClient.invalidateQueries({ queryKey: ['owner-books'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      if (requestedBook) {
        queryClient.invalidateQueries({ queryKey: ['book', requestedBook.id] });
      }
      if (request.offeredBookId) {
        queryClient.invalidateQueries({ queryKey: ['book', request.offeredBookId] });
      }
      toast.success('Swap request accepted!');
      setShowConfirm(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to accept request.';
      toast.error(msg);
      setShowConfirm(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => swapService.rejectRequest(request.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swap-requests'] });
      queryClient.invalidateQueries({ queryKey: ['sent-swaps'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Swap request rejected');
      setShowConfirm(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to reject request.';
      toast.error(msg);
      setShowConfirm(null);
    },
  });

  const isOutgoing = user?.id === request.requesterId;
  const isIncoming =
    (request.ownerId && user?.id === request.ownerId) ||
    (requestedBook && user?.id === requestedBook.ownerId && request.status === 'PENDING');
  const isPending = request.status === 'PENDING';

  // Role identities across return lifecycle
  const isOriginalOwner = user?.id === request.ownerId;
  const isCurrentHolder = user?.id === request.requesterId;

  const hasReviewed = myReviews.some((r) => r.exchangeRequestId === request.id);
  const isParticipant =
    user &&
    (request.requesterId === user.id ||
      (request.ownerId && request.ownerId === user.id) ||
      (requestedBook && requestedBook.ownerId === user.id));
  const canReview = (request.status === 'ACCEPTED' || request.status === 'COMPLETED') && isParticipant && !hasReviewed;

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

  const isLoading = isLoadingReqBook || (request.offeredBookId ? isLoadingOfferedBook : false);

  if (isLoading) {
    return (
      <Card className="border border-border p-6 animate-pulse">
        <div className="flex justify-between items-center mb-4">
          <div className="h-4 bg-muted rounded w-1/4" />
          <div className="h-6 bg-muted rounded w-16" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-y border-border">
          <div className="h-12 bg-muted rounded" />
          <div className="h-12 bg-muted rounded" />
        </div>
        <div className="h-4 bg-muted rounded w-1/3 mt-4" />
      </Card>
    );
  }

  const bookTitle = requestedBook?.title || 'Book';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="border border-border bg-card shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
        {/* Header Ribbon for Incoming/Outgoing */}
        <div className={`h-1 w-full ${isOutgoing ? 'bg-sky-500' : 'bg-primary'}`} />

        <CardHeader className="p-5 pb-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  isOutgoing ? 'bg-sky-500/10 text-sky-600' : 'bg-primary/10 text-primary'
                }`}
              >
                {isOutgoing ? 'Sent Proposal' : 'Received Proposal'}
              </span>
              <span className="text-xs text-muted-foreground font-semibold">ID #{request.id}</span>
            </div>
            <SwapStatusBadge status={request.status} />
          </div>
        </CardHeader>

        <CardContent className="p-5 pt-0 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-11 items-center gap-4 py-4 border-t border-b border-border">
            {/* Left side: What you want / What they want */}
            <div className="md:col-span-5 space-y-1.5 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {isOutgoing ? 'Requested Book' : 'Your Book Requested'}
              </p>
              {requestedBook ? (
                <div className="flex items-start gap-2.5">
                  <div className="h-12 w-9 shrink-0">
                    <BookCover
                      imageUrl={requestedBook.imageUrl}
                      title={requestedBook.title}
                      aspect="portrait"
                      size="xs"
                      className="h-12 w-9"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{requestedBook.title}</p>
                    <p className="text-xs text-muted-foreground truncate">by {requestedBook.author}</p>
                    <span
                      className={`inline-flex items-center rounded-full border px-1.5 py-0.2 text-[9px] font-semibold uppercase mt-1 ${getConditionStyles(
                        requestedBook.bookCondition
                      )}`}
                    >
                      {requestedBook.bookCondition}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-destructive font-medium">Book Details Unavailable</p>
              )}
            </div>

            {/* Middle: Swap Indicator Icon */}
            <div className="md:col-span-1 flex justify-center py-2 md:py-0">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <ArrowLeftRight className="h-4 w-4" />
              </div>
            </div>

            {/* Right side: Offered Book */}
            <div className="md:col-span-5 space-y-1.5 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {isOutgoing ? 'Your Offered Book' : 'Offered Book'}
              </p>
              {offeredBook ? (
                <div className="flex items-start gap-2.5">
                  <div className="h-12 w-9 shrink-0">
                    <BookCover
                      imageUrl={offeredBook.imageUrl}
                      title={offeredBook.title}
                      aspect="portrait"
                      size="xs"
                      className="h-12 w-9"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{offeredBook.title}</p>
                    <p className="text-xs text-muted-foreground truncate">by {offeredBook.author}</p>
                    <span
                      className={`inline-flex items-center rounded-full border px-1.5 py-0.2 text-[9px] font-semibold uppercase mt-1 ${getConditionStyles(
                        offeredBook.bookCondition
                      )}`}
                    >
                      {offeredBook.bookCondition}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <div className="h-12 w-9 rounded-lg bg-muted text-muted-foreground/60 flex items-center justify-center shrink-0 border border-border">
                    <BookMarked className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">Open Swap Choice</p>
                    <p className="text-xs text-muted-foreground truncate">Any available shelf book</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Return Request note banner if present */}
          {request.returnMessage && (
            <div className="mt-3 p-3 rounded-lg border border-primary/20 bg-primary/5 text-xs text-foreground flex items-start gap-2">
              <RotateCcw className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-primary">Return Note: </span>
                <span>{request.returnMessage}</span>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="p-5 pt-0 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              <span>
                {isOutgoing
                  ? `Original Owner ID: #${request.ownerId || requestedBook?.ownerId}`
                  : `Requester ID: #${request.requesterId}`}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>Listed {new Date(request.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Action triggers */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Open Chat button */}
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                const targetUserId = isOutgoing ? request.ownerId || requestedBook?.ownerId : request.requesterId;
                if (!targetUserId) {
                  toast.error('Partner information unavailable');
                  return;
                }
                try {
                  const conv = await chatService.createOrGetConversation({
                    userId: targetUserId,
                    exchangeRequestId: request.id,
                  });
                  navigate(`/chat/${conv.id}`);
                } catch (err: any) {
                  toast.error(err.response?.data?.message || 'Failed to start chat');
                }
              }}
              className="flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold border-border/80 hover:bg-muted"
            >
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
              <span>Chat</span>
            </Button>

            {/* Timeline modal button for processed exchanges */}
            {request.status !== 'PENDING' && request.status !== 'REJECTED' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowTimelineModal(true)}
                className="flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold border-border/80 hover:bg-muted"
              >
                <History className="h-3.5 w-3.5 text-primary" />
                <span>Timeline</span>
              </Button>
            )}

            {/* Initial Pending Actions */}
            {isIncoming && isPending && !showConfirm && (
              <>
                <Button
                  size="sm"
                  onClick={() => setShowConfirm('accept')}
                  className="flex items-center gap-1 h-8 px-3 font-semibold bg-primary hover:bg-primary/95 text-primary-foreground shadow-sm"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Accept</span>
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setShowConfirm('reject')}
                  className="flex items-center gap-1 h-8 px-3 font-semibold shadow-sm"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Reject</span>
                </Button>
              </>
            )}

            {/* RETURN WORKFLOW ACTIONS */}
            {/* 1. Original owner can Request Back when exchange is ACCEPTED or RETURN_DECLINED */}
            {isOriginalOwner && (request.status === 'ACCEPTED' || request.status === 'RETURN_DECLINED') && (
              <Button
                size="sm"
                onClick={() => setReturnAction('request_return')}
                className="flex items-center gap-1.5 h-8 px-3 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Request Back</span>
              </Button>
            )}

            {/* 2. Holder receives Return Request -> can Accept or Decline */}
            {isCurrentHolder && request.status === 'RETURN_REQUESTED' && (
              <>
                <Button
                  size="sm"
                  onClick={() => setReturnAction('accept_return')}
                  className="flex items-center gap-1.5 h-8 px-3 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Accept Return</span>
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setReturnAction('decline_return')}
                  className="flex items-center gap-1.5 h-8 px-3 font-semibold shadow-sm"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Decline</span>
                </Button>
              </>
            )}

            {/* 3. RETURN_IN_PROGRESS: Owner generates OTP; Holder verifies OTP */}
            {isOriginalOwner && (request.status === 'RETURN_ACCEPTED' || request.status === 'RETURN_IN_PROGRESS') && (
              <Button
                size="sm"
                onClick={() => setShowGenerateOtp(true)}
                className="flex items-center gap-1.5 h-8 px-3 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>Generate Return Code</span>
              </Button>
            )}

            {isCurrentHolder && (request.status === 'RETURN_ACCEPTED' || request.status === 'RETURN_IN_PROGRESS') && (
              <Button
                size="sm"
                onClick={() => setShowVerifyOtp(true)}
                className="flex items-center gap-1.5 h-8 px-3 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              >
                <PackageCheck className="h-3.5 w-3.5" />
                <span>Verify Return</span>
              </Button>
            )}

            {/* 4. Owner confirms receipt when RETURNED */}
            {isOriginalOwner && request.status === 'RETURNED' && (
              <Button
                size="sm"
                onClick={() => setReturnAction('confirm_received')}
                className="flex items-center gap-1.5 h-8 px-3 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Confirm Received</span>
              </Button>
            )}

            {/* Review Button when completed */}
            {canReview && (
              <Button
                size="sm"
                onClick={() => setIsReviewOpen(true)}
                className="flex items-center gap-1 h-8 px-3 font-semibold bg-primary hover:bg-primary/95 text-primary-foreground shadow-sm animate-in fade-in"
              >
                <Star className="h-3.5 w-3.5 fill-current" />
                <span>Leave Review</span>
              </Button>
            )}
          </div>
        </CardFooter>

        {/* Confirmation Overlays inside the card itself for pending requests */}
        <AnimatePresence>
          {showConfirm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-border bg-muted/30 p-5 space-y-3 text-sm"
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle
                  className={`h-5 w-5 ${
                    showConfirm === 'accept' ? 'text-amber-500' : 'text-destructive'
                  } flex-shrink-0 mt-0.5`}
                />
                <div>
                  <h4 className="font-bold text-foreground">
                    {showConfirm === 'accept' ? 'Accept Swap Proposal?' : 'Reject Swap Proposal?'}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {showConfirm === 'accept'
                      ? 'Accepting will transfer this book to the requester. You can request it back later.'
                      : 'Rejecting will close the exchange request. This action cannot be undone.'}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConfirm(null)}
                  disabled={acceptMutation.isPending || rejectMutation.isPending}
                  className="h-8"
                >
                  Cancel
                </Button>
                {showConfirm === 'accept' ? (
                  <Button
                    size="sm"
                    onClick={() => acceptMutation.mutate()}
                    disabled={acceptMutation.isPending}
                    className="h-8 font-semibold"
                  >
                    {acceptMutation.isPending ? 'Accepting...' : 'Confirm Accept'}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => rejectMutation.mutate()}
                    disabled={rejectMutation.isPending}
                    className="h-8 font-semibold"
                  >
                    {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Reject'}
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal: Return Action Confirmation */}
        {returnAction && (
          <ReturnActionDialog
            isOpen={!!returnAction}
            onClose={() => setReturnAction(null)}
            exchangeId={request.id}
            bookTitle={bookTitle}
            actionType={returnAction}
          />
        )}

        {/* Modal: Generate Return OTP */}
        {showGenerateOtp && (
          <ReturnOtpGenerateDialog
            isOpen={showGenerateOtp}
            onClose={() => setShowGenerateOtp(false)}
            exchangeId={request.id}
            bookTitle={bookTitle}
          />
        )}

        {/* Modal: Verify Return OTP */}
        {showVerifyOtp && (
          <ReturnOtpVerifyDialog
            isOpen={showVerifyOtp}
            onClose={() => setShowVerifyOtp(false)}
            exchangeId={request.id}
            bookTitle={bookTitle}
          />
        )}

        {/* Modal: Full Lifecycle & Timeline */}
        {showTimelineModal && (
          <ReturnDetailsModal
            isOpen={showTimelineModal}
            onClose={() => setShowTimelineModal(false)}
            exchangeId={request.id}
          />
        )}

        {/* Modal: Review Dialog */}
        {isReviewOpen && requestedBook && (
          <ReviewDialog
            isOpen={isReviewOpen}
            onClose={() => setIsReviewOpen(false)}
            exchangeRequestId={request.id}
            reviewedUserName={
              user?.id === request.requesterId
                ? `User #${requestedBook.ownerId}`
                : `User #${request.requesterId}`
            }
          />
        )}
      </Card>
    </motion.div>
  );
};
