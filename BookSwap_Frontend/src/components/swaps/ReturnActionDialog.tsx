import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { RotateCcw, Check, X, CheckCircle2, MessageSquare } from 'lucide-react';
import { swapService } from '../../services/swapService';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Textarea } from '../ui/textarea';

export type ReturnActionType =
  | 'request_return'
  | 'accept_return'
  | 'decline_return'
  | 'confirm_received';

interface ReturnActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  exchangeId: number;
  bookTitle: string;
  actionType: ReturnActionType;
  onSuccess?: () => void;
}

export const ReturnActionDialog: React.FC<ReturnActionDialogProps> = ({
  isOpen,
  onClose,
  exchangeId,
  bookTitle,
  actionType,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['swap-requests'] });
    queryClient.invalidateQueries({ queryKey: ['sent-swaps'] });
    queryClient.invalidateQueries({ queryKey: ['exchange-return', exchangeId] });
    queryClient.invalidateQueries({ queryKey: ['exchange-history', exchangeId] });
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['books'] });
    queryClient.invalidateQueries({ queryKey: ['user-books'] });
  };

  const actionMutation = useMutation({
    mutationFn: async () => {
      switch (actionType) {
        case 'request_return':
          return await swapService.requestReturn(exchangeId, { message });
        case 'accept_return':
          return await swapService.acceptReturn(exchangeId);
        case 'decline_return':
          return await swapService.declineReturn(exchangeId, { message });
        case 'confirm_received':
          return await swapService.confirmReceived(exchangeId);
        default:
          throw new Error('Unknown action type');
      }
    },
    onSuccess: () => {
      invalidateAll();
      const msgs: Record<ReturnActionType, string> = {
        request_return: 'Return request sent to the current holder.',
        accept_return: 'Return request accepted. Return is now in progress.',
        decline_return: 'Return request declined.',
        confirm_received: 'Receipt confirmed! Book return completed and restored to your shelf.',
      };
      toast.success(msgs[actionType] || 'Action completed successfully');
      setMessage('');
      onClose();
      onSuccess?.();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to complete action. Please try again.';
      toast.error(msg);
    },
  });

  if (!isOpen) return null;

  const getDialogConfig = () => {
    switch (actionType) {
      case 'request_return':
        return {
          title: 'Request Book Back',
          description: `You are requesting the current holder to return "${bookTitle}".`,
          icon: <RotateCcw className="h-5 w-5 text-primary" />,
          confirmText: 'Send Return Request',
          confirmVariant: 'default' as const,
          placeholder: 'Optional message to current holder (e.g. Hope you enjoyed it! Please return by Friday...)',
          showInput: true,
        };
      case 'accept_return':
        return {
          title: 'Accept Return Request?',
          description: `Confirm that you will return "${bookTitle}" to the owner. This will move the exchange to Return In Progress.`,
          icon: <Check className="h-5 w-5 text-emerald-500" />,
          confirmText: 'Accept & Start Return',
          confirmVariant: 'default' as const,
          showInput: false,
        };
      case 'decline_return':
        return {
          title: 'Decline Return Request?',
          description: `Explain why you are unable to return "${bookTitle}" at this time.`,
          icon: <X className="h-5 w-5 text-destructive" />,
          confirmText: 'Decline Request',
          confirmVariant: 'destructive' as const,
          placeholder: 'Reason for declining (e.g. Currently halfway through, can I return next week?)...',
          showInput: true,
        };
      case 'confirm_received':
        return {
          title: 'Confirm Book Receipt',
          description: `Have you received "${bookTitle}" back in satisfactory condition? Confirming will complete the return cycle and restore this book to your shelf.`,
          icon: <CheckCircle2 className="h-5 w-5 text-teal-500" />,
          confirmText: 'Confirm Receipt & Complete',
          confirmVariant: 'default' as const,
          showInput: false,
        };
    }
  };

  const config = getDialogConfig();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md"
      >
        <Card className="border border-border shadow-2xl overflow-hidden">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                {config.icon}
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-foreground">
                  {config.title}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Book: <span className="font-semibold text-foreground">{bookTitle}</span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 pt-2 pb-4 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {config.description}
            </p>

            {config.showInput && (
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-primary" />
                  <span>Message / Note</span>
                </label>
                <Textarea
                  value={message}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                  placeholder={config.placeholder}
                  className="min-h-[90px] text-xs resize-none"
                  disabled={actionMutation.isPending}
                />
              </div>
            )}
          </CardContent>

          <CardFooter className="p-5 pt-3 border-t border-border flex justify-end gap-2.5 bg-muted/20">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={actionMutation.isPending}
              className="h-9 px-4 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant={config.confirmVariant}
              onClick={() => actionMutation.mutate()}
              disabled={actionMutation.isPending}
              className="h-9 px-4 text-xs font-bold shadow-sm"
            >
              {actionMutation.isPending ? 'Processing...' : config.confirmText}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};
