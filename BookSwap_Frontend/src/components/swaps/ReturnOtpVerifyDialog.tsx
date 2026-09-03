import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ShieldCheck, PackageCheck, AlertCircle, Loader2 } from 'lucide-react';
import { swapService } from '../../services/swapService';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { ReturnOtpInput } from './ReturnOtpInput';

interface ReturnOtpVerifyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  exchangeId: number;
  bookTitle: string;
  onSuccess?: () => void;
}

export const ReturnOtpVerifyDialog: React.FC<ReturnOtpVerifyDialogProps> = ({
  isOpen,
  onClose,
  exchangeId,
  bookTitle,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [otp, setOtp] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const verifyMutation = useMutation({
    mutationFn: () => swapService.verifyReturnOtp(exchangeId, otp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-return', exchangeId] });
      queryClient.invalidateQueries({ queryKey: ['exchange-history', exchangeId] });
      queryClient.invalidateQueries({ queryKey: ['swap-requests'] });
      queryClient.invalidateQueries({ queryKey: ['sent-swaps'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['user-books'] });
      toast.success('Return code verified! Book marked as returned.');
      setOtp('');
      setErrorMessage(null);
      onClose();
      onSuccess?.();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Verification failed. Please check the code and try again.';
      setErrorMessage(msg);
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (otp.length !== 6) {
      setErrorMessage('Please enter all 6 digits of the verification code.');
      return;
    }
    setErrorMessage(null);
    verifyMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md"
      >
        <Card className="border border-border shadow-2xl overflow-hidden bg-card">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <PackageCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-foreground">
                  Verify Physical Book Return
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Book: <span className="font-semibold text-foreground">{bookTitle}</span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="p-5 pt-2 pb-4 space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Enter the 6-digit verification code provided by the book owner after you physically handed over the book.
              </p>

              {/* 6-Digit OTP Input */}
              <div className="py-2">
                <ReturnOtpInput
                  value={otp}
                  onChange={(val) => {
                    setOtp(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  disabled={verifyMutation.isPending}
                  hasError={!!errorMessage}
                  length={6}
                />
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="flex items-start gap-2 p-3 rounded-xl border border-destructive/20 bg-destructive/5 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="font-medium">{errorMessage}</p>
                </div>
              )}

              {/* Security Hint */}
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/60">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                <span>Entering this code confirms the physical return and moves status to Returned.</span>
              </div>
            </CardContent>

            <CardFooter className="p-5 pt-3 border-t border-border flex justify-end gap-2.5 bg-muted/20">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={verifyMutation.isPending}
                className="h-9 px-4 text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={otp.length !== 6 || verifyMutation.isPending}
                className="h-9 px-4 text-xs font-bold bg-primary text-primary-foreground shadow-sm"
              >
                {verifyMutation.isPending ? (
                  <div className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </div>
                ) : (
                  'Verify Return'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};
