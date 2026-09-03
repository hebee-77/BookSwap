import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { KeyRound, Copy, Check, RotateCcw, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';
import { swapService } from '../../services/swapService';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import type { ReturnOtpGenerateResponse } from '../../types/swap';

interface ReturnOtpGenerateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  exchangeId: number;
  bookTitle: string;
  onSuccess?: () => void;
}

export const ReturnOtpGenerateDialog: React.FC<ReturnOtpGenerateDialogProps> = ({
  isOpen,
  onClose,
  exchangeId,
  bookTitle,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [generatedData, setGeneratedData] = useState<ReturnOtpGenerateResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);

  const generateMutation = useMutation({
    mutationFn: () => swapService.generateReturnOtp(exchangeId),
    onSuccess: (data) => {
      setGeneratedData(data);
      queryClient.invalidateQueries({ queryKey: ['exchange-return', exchangeId] });
      queryClient.invalidateQueries({ queryKey: ['exchange-history', exchangeId] });
      queryClient.invalidateQueries({ queryKey: ['swap-requests'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Return verification code generated successfully');
      onSuccess?.();
    },
  });

  // Countdown timer effect
  useEffect(() => {
    if (!generatedData?.expiresAt) return;

    const calculateTime = () => {
      const difference = new Date(generatedData.expiresAt).getTime() - new Date().getTime();
      if (difference <= 0) {
        setTimeLeft('00:00');
        setIsExpired(true);
        return;
      }
      setIsExpired(false);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      setTimeLeft(
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [generatedData?.expiresAt]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (generatedData?.otp) {
      navigator.clipboard.writeText(generatedData.otp);
      setCopied(true);
      toast.success('Verification code copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
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
                <KeyRound className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-foreground">
                  Return Verification Code
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Book: <span className="font-semibold text-foreground">{bookTitle}</span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 pt-2 pb-4 space-y-4">
            {!generatedData ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Generate a secure 6-digit verification code to verify the physical handover of your book.
                </p>

                <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Important Handover Rule</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Provide this code to the holder <strong>only after</strong> you have physically received and inspected the book.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Code Display */}
                <div className="text-center p-5 rounded-2xl bg-muted/40 border border-border space-y-2">
                  <span className="text-xs uppercase font-bold tracking-widest text-muted-foreground">
                    Physical Return Code
                  </span>
                  <div className="text-3xl sm:text-4xl font-black tracking-widest text-primary font-mono select-all">
                    {generatedData.otp}
                  </div>
                  <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground font-semibold">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    {isExpired ? (
                      <span className="text-destructive font-bold">Code expired</span>
                    ) : (
                      <span>Expires in {timeLeft}</span>
                    )}
                  </div>
                </div>

                {/* Handover Notice */}
                <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-primary">
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    <span>Physical Verification Protocol</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Once the holder enters this code into BookSwap, the book will be marked as returned. You can then confirm receipt to restore book ownership.
                  </p>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="p-5 pt-3 border-t border-border flex justify-end gap-2.5 bg-muted/20">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={generateMutation.isPending}
              className="h-9 px-4 text-xs font-semibold"
            >
              Close
            </Button>

            {!generatedData ? (
              <Button
                size="sm"
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                className="h-9 px-4 text-xs font-bold bg-primary text-primary-foreground shadow-sm"
              >
                {generateMutation.isPending ? 'Generating Code...' : 'Generate Code'}
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                  className="h-9 px-3 text-xs font-semibold gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Regenerate</span>
                </Button>
                <Button
                  size="sm"
                  onClick={handleCopy}
                  className="h-9 px-4 text-xs font-bold bg-primary text-primary-foreground shadow-sm gap-1.5"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Code'}</span>
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};
