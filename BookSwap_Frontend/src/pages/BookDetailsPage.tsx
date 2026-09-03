import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Edit, Trash2, Calendar, User, Info, CheckCircle, AlertTriangle, ArrowLeftRight, LogIn, MessageSquare } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { bookService } from '../services/bookService';
import { chatService } from '../services/chatService';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { SwapRequestDialog } from '../components/swaps/SwapRequestDialog';
import { BookCover } from '../components/books/BookCover';

export const BookDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSwapOpen, setIsSwapOpen] = useState(false);

  const bookId = Number(id);

  const { data: book, isLoading, isError } = useQuery({
    queryKey: ['book', bookId],
    queryFn: () => bookService.getBookById(bookId),
    enabled: !isNaN(bookId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => bookService.deleteBook(bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('Book deleted successfully');
      navigate('/books');
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const isOwner = isAuthenticated && user && book && user.id === book.ownerId;

  if (isNaN(bookId) || isError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-foreground">Book Not Found</h2>
        <p className="text-muted-foreground mt-2 mb-6">
          The book you are looking for does not exist, has been removed, or the ID is invalid.
        </p>
        <Link to="/books">
          <Button variant="outline" className="inline-flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Shelf</span>
          </Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading Book Details...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-foreground">Book Not Found</h2>
        <p className="text-muted-foreground mt-2 mb-6">
          The book details could not be loaded.
        </p>
        <Link to="/books">
          <Button variant="outline" className="inline-flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Shelf</span>
          </Button>
        </Link>
      </div>
    );
  }

  const getConditionBadge = (condition: string) => {
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
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 bg-background relative">
      {/* Return Navigation */}
      <Link to="/books" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to shelf listings</span>
      </Link>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Book Left Side Cover */}
        <div className="md:col-span-1 space-y-3">
          <BookCover
            imageUrl={book.imageUrl}
            title={book.title}
            aspect="portrait"
            fit="contain"
            size="xl"
            className="w-full rounded-2xl shadow-md border border-border/80 overflow-hidden"
          />
          <div className="flex justify-center">
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${getConditionBadge(book.bookCondition)}`}>
              {book.bookCondition} Condition
            </span>
          </div>
        </div>

        {/* Book Right Side Info */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                {book.title}
              </h1>
            </div>
            <p className="text-lg font-medium text-muted-foreground">by {book.author}</p>
          </div>

          <div className="border-t border-b border-border py-4 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2.5">
              <User className="h-5 w-5 text-muted-foreground/75" />
              <div>
                <p className="text-xs text-muted-foreground">Owner</p>
                <p className="text-sm font-semibold text-foreground">
                  {book.ownerName ? book.ownerName : `User #${book.ownerId}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Calendar className="h-5 w-5 text-muted-foreground/75" />
              <div>
                <p className="text-xs text-muted-foreground">Listed On</p>
                <p className="text-sm font-semibold text-foreground">
                  {new Date(book.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Info className="h-5 w-5 text-muted-foreground/75" />
              <div>
                <p className="text-xs text-muted-foreground">ISBN Number</p>
                <p className="text-sm font-semibold text-foreground">{book.isbn || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <CheckCircle className="h-5 w-5 text-muted-foreground/75" />
              <div>
                <p className="text-xs text-muted-foreground">Swap Status</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${book.available ? 'bg-emerald-500 animate-pulse' : 'bg-rose-400'}`} />
                  <span className="text-sm font-semibold text-foreground">
                    {book.available ? 'Available for Swap' : 'Exchange Completed'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-foreground">About this Book</h3>
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
              {book.description || 'No detailed description provided for this book shelf listing.'}
            </p>
          </div>

          {/* Owner Action Buttons */}
          {isOwner && (
            <div className="flex gap-3 border-t border-border pt-6 mt-4">
              <Link to={`/books/${book.id}/edit`}>
                <Button className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  <span>Edit Listing</span>
                </Button>
              </Link>
              <Button variant="destructive" onClick={() => setShowConfirm(true)} className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                <span>Remove Book</span>
              </Button>
            </div>
          )}

          {/* Non-Owner Swap Propose & Message Action Button */}
          {!isOwner && (
            <div className="flex flex-wrap gap-3 border-t border-border pt-6 mt-4">
              {isAuthenticated ? (
                <>
                  {book.available && (
                    <Button onClick={() => setIsSwapOpen(true)} className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold shadow-sm">
                      <ArrowLeftRight className="h-4 w-4" />
                      <span>Request Swap</span>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        const conv = await chatService.createOrGetConversation({ userId: book.ownerId });
                        navigate(`/chat/${conv.id}`);
                      } catch (err: any) {
                        toast.error(err.response?.data?.message || 'Failed to start chat with owner');
                      }
                    }}
                    className="flex items-center gap-2 font-semibold border-border/80 hover:bg-muted"
                  >
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span>Message Owner</span>
                  </Button>
                </>
              ) : (
                <Link to="/login">
                  <Button className="flex items-center gap-2 font-semibold">
                    <LogIn className="h-4 w-4" />
                    <span>Login to Swap or Chat</span>
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal Overlay */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md"
            >
              <Card className="border border-destructive/20 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-destructive flex items-center gap-2">
                    <Trash2 className="h-5 w-5" />
                    <span>Delete Book Listing?</span>
                  </CardTitle>
                  <CardDescription className="pt-2 text-foreground font-medium">
                    Are you sure you want to delete **"{book.title}"**?
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground leading-relaxed">
                  This action is destructive and cannot be undone. This book listing will be permanently removed from the BookSwap database.
                </CardContent>
                <CardFooter className="flex justify-end gap-3 border-t border-border pt-4">
                  <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={deleteMutation.isPending}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="flex items-center gap-1.5"
                  >
                    {deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Swap Request Dialog Trigger Modal */}
      <SwapRequestDialog
        isOpen={isSwapOpen}
        onClose={() => setIsSwapOpen(false)}
        requestedBook={book}
      />
    </div>
  );
};
