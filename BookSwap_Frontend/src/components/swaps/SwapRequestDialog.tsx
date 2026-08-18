import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { X, BookOpen, AlertCircle, Check, Loader2, ArrowLeftRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { bookService } from '../../services/bookService';
import { swapService } from '../../services/swapService';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';

interface SwapRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  requestedBook: {
    id: number;
    title: string;
    author: string;
    bookCondition: string;
  };
}

export const SwapRequestDialog: React.FC<SwapRequestDialogProps> = ({ isOpen, onClose, requestedBook }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);

  // Fetch current user's books
  const { data: userBooksData, isLoading } = useQuery({
    queryKey: ['owner-books', user?.id],
    queryFn: () => bookService.getBooksByOwner(user!.id),
    enabled: isOpen && !!user?.id,
  });

  const userBooks = userBooksData?.content || [];
  // Filter for available books
  const eligibleBooks = userBooks.filter((book) => book.available);

  const createMutation = useMutation({
    mutationFn: () => swapService.createRequest({ bookId: requestedBook.id }),
    onSuccess: () => {
      // Invalidate both books lists and swap requests
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['book', requestedBook.id] });
      queryClient.invalidateQueries({ queryKey: ['sent-swaps'] });
      queryClient.invalidateQueries({ queryKey: ['swap-requests'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      // Save the offered book selection in localStorage for client-side pairing display
      // We store targetBookId -> offeredBookId
      try {
        const storedOffers = localStorage.getItem('swap_offers_mapping') || '{}';
        const mapping = JSON.parse(storedOffers);
        mapping[requestedBook.id] = selectedBookId;
        localStorage.setItem('swap_offers_mapping', JSON.stringify(mapping));
      } catch (e) {
        console.error('Error saving offered book mapping:', e);
      }

      toast.success('Swap request sent successfully!');
      onClose();
    },
    onError: (err: any) => {
      console.error('Create request error:', err);
      const msg = err.response?.data?.message || 'Failed to send request. Please try again.';
      toast.error(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookId) {
      toast.error('Please select one of your books to offer in exchange');
      return;
    }
    createMutation.mutate();
  };

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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          {/* Overlay click to close */}
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-lg z-10"
          >
            <Card className="border border-border shadow-2xl relative bg-card overflow-hidden">
              <button
                onClick={onClose}
                type="button"
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground rounded-full p-1.5 hover:bg-muted transition-colors focus:outline-none"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <ArrowLeftRight className="h-5 w-5 text-primary animate-pulse" />
                  <span>Propose Book Swap</span>
                </CardTitle>
                <CardDescription className="pt-1.5">
                  Propose to swap one of your books in exchange for **"{requestedBook.title}"**.
                </CardDescription>
              </CardHeader>

              <CardContent className="max-h-[350px] overflow-y-auto px-6 py-2 space-y-4">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">Checking your bookshelf...</p>
                  </div>
                ) : userBooks.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-border rounded-xl bg-muted/10">
                    <AlertCircle className="mx-auto h-10 w-10 text-amber-500 mb-3" />
                    <h4 className="font-semibold text-foreground">Your bookshelf is empty</h4>
                    <p className="text-xs text-muted-foreground mt-1 mb-4 px-6 leading-relaxed">
                      You must add at least one book to your shelf before you can request exchanges.
                    </p>
                    <Link to="/books/new" onClick={onClose}>
                      <Button size="sm" className="font-semibold">
                        Add a Book to Shelf
                      </Button>
                    </Link>
                  </div>
                ) : eligibleBooks.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-border rounded-xl bg-muted/10">
                    <AlertCircle className="mx-auto h-10 w-10 text-amber-500 mb-3" />
                    <h4 className="font-semibold text-foreground">No books available</h4>
                    <p className="text-xs text-muted-foreground mt-1 px-6 leading-relaxed">
                      All books on your shelf are currently checked out, swapped, or pending swap requests.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Select a book to offer
                    </span>
                    
                    <div className="space-y-2">
                      {eligibleBooks.map((book) => {
                        const isSelected = selectedBookId === book.id;
                        return (
                          <button
                            key={book.id}
                            type="button"
                            onClick={() => setSelectedBookId(book.id)}
                            className={`w-full flex items-center justify-between p-3.5 border rounded-xl transition-all text-left group ${
                              isSelected
                                ? 'bg-primary/5 border-primary shadow-sm'
                                : 'bg-card border-border hover:bg-muted/50 hover:border-muted-foreground/30'
                            }`}
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                                isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground group-hover:bg-muted-foreground/10 group-hover:text-foreground'
                              }`}>
                                <BookOpen className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                  {book.title}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">by {book.author}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${getConditionStyles(book.bookCondition)}`}>
                                {book.bookCondition}
                              </span>
                              
                              <div className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${
                                isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-border bg-card'
                              }`}>
                                {isSelected && <Check className="h-3 w-3" />}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex justify-end gap-3 border-t border-border pt-4 px-6 pb-6 bg-muted/10 mt-4">
                <Button variant="outline" onClick={onClose} disabled={createMutation.isPending}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!selectedBookId || createMutation.isPending}
                  className="flex items-center gap-2 font-semibold"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending request...</span>
                    </>
                  ) : (
                    <span>Propose Exchange</span>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
