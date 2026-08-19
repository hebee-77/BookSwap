import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeftRight } from 'lucide-react';
import { ReviewForm } from './ReviewForm';

interface ReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  exchangeRequestId: number;
  reviewedUserName: string;
}

export const ReviewDialog: React.FC<ReviewDialogProps> = ({
  isOpen,
  onClose,
  exchangeRequestId,
  reviewedUserName,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative w-full max-w-md bg-card border border-border shadow-xl rounded-2xl overflow-hidden z-10"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-primary" />
                <span className="font-extrabold text-foreground tracking-tight">
                  Review Swap Partner
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Content */}
            <div className="p-6">
              <p className="text-xs text-muted-foreground font-semibold mb-6">
                Tell the community about your swap transaction with{' '}
                <strong className="text-foreground">{reviewedUserName}</strong>.
              </p>
              <ReviewForm
                exchangeRequestId={exchangeRequestId}
                onSubmitSuccess={onClose}
                onCancel={onClose}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
