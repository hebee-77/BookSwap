import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { X, RotateCcw, Loader2, Info } from 'lucide-react';
import { swapService } from '../../services/swapService';
import { ReturnTimeline } from './ReturnTimeline';
import { SwapStatusBadge } from './SwapStatusBadge';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { BookCover } from '../books/BookCover';

interface ReturnDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  exchangeId: number;
}

export const ReturnDetailsModal: React.FC<ReturnDetailsModalProps> = ({
  isOpen,
  onClose,
  exchangeId,
}) => {
  const { data: returnDetails, isLoading } = useQuery({
    queryKey: ['exchange-return', exchangeId],
    queryFn: () => swapService.getReturnDetails(exchangeId),
    enabled: isOpen && !!exchangeId,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl my-8"
      >
        <Card className="border border-border shadow-2xl overflow-hidden bg-card">
          <CardHeader className="p-6 pb-4 border-b border-border flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl font-bold text-foreground">
                  Exchange & Return Lifecycle
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Exchange Reference #{exchangeId}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm font-medium text-muted-foreground">Loading lifecycle details...</p>
              </div>
            ) : !returnDetails ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Return details unavailable.
              </div>
            ) : (
              <>
                {/* Status & Book Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-10 shrink-0">
                      <BookCover
                        imageUrl={returnDetails.bookImageUrl}
                        title={returnDetails.bookTitle}
                        aspect="portrait"
                        size="xs"
                        className="h-14 w-10"
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground line-clamp-1">
                        {returnDetails.bookTitle}
                      </h4>
                      <p className="text-xs text-muted-foreground">by {returnDetails.bookAuthor}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[11px] text-muted-foreground font-medium">
                          Original Owner: <span className="font-semibold text-foreground">{returnDetails.ownerName}</span>
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-[11px] text-muted-foreground font-medium">
                          Holder: <span className="font-semibold text-foreground">{returnDetails.requesterName}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 self-start sm:self-center">
                    <SwapStatusBadge status={returnDetails.status} />
                  </div>
                </div>

                {/* Return Note if present */}
                {returnDetails.returnMessage && (
                  <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-2.5 text-xs text-foreground">
                    <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-primary">Return Note / Message:</p>
                      <p className="text-muted-foreground mt-0.5 leading-relaxed">{returnDetails.returnMessage}</p>
                    </div>
                  </div>
                )}

                {/* Timeline Header */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-bold text-foreground tracking-tight uppercase text-muted-foreground">
                    Status Progression Timeline
                  </h3>
                  <ReturnTimeline
                    status={returnDetails.status}
                    history={returnDetails.history}
                    exchangeCreatedAt={returnDetails.exchangeCreatedAt}
                    returnRequestedAt={returnDetails.returnRequestedAt}
                    returnAcceptedAt={returnDetails.returnAcceptedAt}
                    returnDeclinedAt={returnDetails.returnDeclinedAt}
                    returnedAt={returnDetails.returnedAt}
                    confirmedAt={returnDetails.confirmedAt}
                    returnMessage={returnDetails.returnMessage}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
