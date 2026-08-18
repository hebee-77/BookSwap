import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { bookService } from '../services/bookService';
import type { BookCondition } from '../types/book';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

const bookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  isbn: z.string().optional(),
  description: z.string().optional(),
  bookCondition: z.enum(['NEW', 'GOOD', 'FAIR', 'POOR'] as const, {
    message: 'Book condition is required',
  }),
});

type BookFormData = z.infer<typeof bookSchema>;

export const EditBookPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bookId = Number(id);

  const { data: book, isLoading, isError } = useQuery({
    queryKey: ['book', bookId],
    queryFn: () => bookService.getBookById(bookId),
    enabled: !isNaN(bookId),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<BookFormData>({
    resolver: zodResolver(bookSchema),
  });

  // Populate form values when data is loaded
  useEffect(() => {
    if (book) {
      reset({
        title: book.title,
        author: book.author,
        isbn: book.isbn || '',
        description: book.description || '',
        bookCondition: book.bookCondition,
      });
    }
  }, [book, reset]);

  // Check authorization in frontend (backend will validate it anyway)
  useEffect(() => {
    if (book && isAuthenticated && user && book.ownerId !== user.id) {
      toast.error("You don't have permission to edit this book");
      navigate(`/books/${book.id}`, { replace: true });
    }
  }, [book, isAuthenticated, user, navigate]);

  const selectedCondition = watch('bookCondition');

  const updateMutation = useMutation({
    mutationFn: (updatedBook: BookFormData) => bookService.updateBook(bookId, updatedBook),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['book', bookId] });
      toast.success('Book updated successfully!');
      navigate(`/books/${bookId}`);
    },
    onError: (err: any) => {
      console.error('Update book error:', err);
      const msg = err.response?.data?.message || 'Failed to update book. Please try again.';
      toast.error(msg);
    },
  });

  const onSubmit = (data: BookFormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    updateMutation.mutate(data, {
      onSettled: () => setIsSubmitting(false),
    });
  };

  const conditions: BookCondition[] = ['NEW', 'GOOD', 'FAIR', 'POOR'];

  if (isNaN(bookId) || isError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-foreground">Book Not Found</h2>
        <p className="text-muted-foreground mt-2 mb-6">
          The book you are trying to edit does not exist or the ID is invalid.
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8 bg-background">
      {/* Return Navigation */}
      <Link to={`/books/${bookId}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" />
        <span>Cancel and return to details</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border border-border shadow-xl bg-card">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Edit className="h-6 w-6 text-primary" />
              <span>Edit Book Listing</span>
            </CardTitle>
            <CardDescription>
              Update your book details. Changes will be reflected immediately.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="title">
                  Book Title
                </label>
                <Input
                  {...register('title')}
                  id="title"
                  type="text"
                  placeholder="e.g. The Hobbit"
                  className={errors.title ? 'border-destructive focus-visible:ring-destructive' : ''}
                  disabled={isSubmitting}
                />
                {errors.title && (
                  <p className="text-xs font-semibold text-destructive">{errors.title.message}</p>
                )}
              </div>

              {/* Author */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="author">
                  Author
                </label>
                <Input
                  {...register('author')}
                  id="author"
                  type="text"
                  placeholder="e.g. J.R.R. Tolkien"
                  className={errors.author ? 'border-destructive focus-visible:ring-destructive' : ''}
                  disabled={isSubmitting}
                />
                {errors.author && (
                  <p className="text-xs font-semibold text-destructive">{errors.author.message}</p>
                )}
              </div>

              {/* ISBN */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="isbn">
                  ISBN Number (Optional)
                </label>
                <Input
                  {...register('isbn')}
                  id="isbn"
                  type="text"
                  placeholder="e.g. 9780261102217"
                  disabled={isSubmitting}
                />
              </div>

              {/* Book Condition Select */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Book Condition
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {conditions.map((cond) => {
                    const isSelected = selectedCondition === cond;
                    return (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => setValue('bookCondition', cond)}
                        disabled={isSubmitting}
                        className={`py-2.5 text-xs font-semibold border rounded-lg uppercase tracking-wider transition-all ${
                          isSelected
                            ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                            : 'bg-card border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        {cond}
                      </button>
                    );
                  })}
                </div>
                {errors.bookCondition && (
                  <p className="text-xs font-semibold text-destructive">{errors.bookCondition.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="description">
                  Shelf Description (Optional)
                </label>
                <textarea
                  {...register('description')}
                  id="description"
                  rows={4}
                  placeholder="Describe the condition, notes about the edition, or why someone should read it..."
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isSubmitting}
                />
              </div>

              <Button type="submit" className="w-full h-11 mt-4 font-medium" disabled={isSubmitting}>
                {isSubmitting ? 'Saving changes...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
