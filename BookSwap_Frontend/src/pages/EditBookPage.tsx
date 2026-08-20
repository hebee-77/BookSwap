import React, { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, AlertTriangle, UploadCloud, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { bookService } from '../services/bookService';
import type { BookCondition } from '../types/book';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { BookCover } from '../components/books/BookCover';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file?: File) => {
    setImageError(null);
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setImageError('Only JPEG, PNG, and WebP images are allowed');
      toast.error('Invalid image type. Please select a JPG, PNG, or WebP file.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setImageError('Image size exceeds maximum limit of 5 MB');
      toast.error('Image is too large. Maximum size is 5 MB.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleRemoveNewImage = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateMutation = useMutation({
    mutationFn: (formData: FormData) => bookService.updateBook(bookId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['book', bookId] });
      queryClient.invalidateQueries({ queryKey: ['user-books'] });
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

    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('author', data.author);
    if (data.isbn) formData.append('isbn', data.isbn);
    if (data.description) formData.append('description', data.description);
    formData.append('bookCondition', data.bookCondition);

    if (selectedFile) {
      formData.append('image', selectedFile);
    }

    updateMutation.mutate(formData, {
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
              {/* Cover Image Upload / Change */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block">
                  Book Cover Image
                </label>

                {previewUrl ? (
                  <div className="relative flex items-center gap-4 p-3 rounded-xl border border-border bg-muted/20">
                    <div className="relative h-24 w-18 aspect-[3/4] rounded-lg overflow-hidden border border-border shrink-0 bg-background">
                      <img
                        src={previewUrl}
                        alt="New cover preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">New Image Selected</span>
                      <p className="text-sm font-bold text-foreground truncate mt-0.5">{selectedFile?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedFile ? (selectedFile.size / (1024 * 1024)).toFixed(2) + ' MB' : ''}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveNewImage}
                        disabled={isSubmitting}
                        className="mt-1.5 h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive flex items-center gap-1"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Cancel replacement</span>
                      </Button>
                    </div>
                  </div>
                ) : book?.imageUrl ? (
                  <div className="flex items-center gap-4 p-3 rounded-xl border border-border bg-muted/10">
                    <div className="h-24 w-18 shrink-0">
                      <BookCover imageUrl={book.imageUrl} title={book.title} aspect="portrait" size="sm" className="h-24 w-18" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-muted-foreground">Current Book Cover</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSubmitting}
                        className="mt-2 h-8 text-xs flex items-center gap-1.5"
                      >
                        <UploadCloud className="h-3.5 w-3.5" />
                        <span>Replace Cover Image</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-muted/10 hover:bg-muted/20 text-center group"
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2 group-hover:scale-110 transition-transform">
                      <UploadCloud className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      Click to upload a book cover
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports JPG, PNG, WebP (up to 5 MB)
                    </p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                  id="edit-book-cover-upload"
                  aria-label="Upload book cover image"
                  disabled={isSubmitting}
                />

                {imageError && (
                  <p className="text-xs font-semibold text-destructive">{imageError}</p>
                )}
              </div>

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
