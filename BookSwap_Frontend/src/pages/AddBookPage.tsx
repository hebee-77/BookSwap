import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ArrowLeft, PlusCircle, UploadCloud, X } from 'lucide-react';
import { bookService } from '../services/bookService';
import type { BookCondition } from '../types/book';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

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

export const AddBookPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BookFormData>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: '',
      author: '',
      isbn: '',
      description: '',
      bookCondition: 'GOOD',
    },
  });

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

  const handleRemoveImage = () => {
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

  const createMutation = useMutation({
    mutationFn: (formData: FormData) => bookService.createBook(formData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['user-books'] });
      toast.success('Book listed successfully!');
      navigate(`/books/${data.id}`);
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

    createMutation.mutate(formData, {
      onSettled: () => setIsSubmitting(false),
    });
  };

  const conditions: BookCondition[] = ['NEW', 'GOOD', 'FAIR', 'POOR'];

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8 bg-background">
      {/* Return Navigation */}
      <Link to="/books" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" />
        <span>Cancel and return to shelf</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border border-border shadow-xl bg-card">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <PlusCircle className="h-6 w-6 text-primary" />
              <span>List a New Book</span>
            </CardTitle>
            <CardDescription>
              Share a book from your shelf with the community by providing details below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Cover Image Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block">
                  Book Cover Image (Optional)
                </label>
                
                {previewUrl ? (
                  <div className="relative flex items-center gap-4 p-3 rounded-xl border border-border bg-muted/20">
                    <div className="relative h-24 w-18 aspect-[3/4] rounded-lg overflow-hidden border border-border shrink-0 bg-background">
                      <img
                        src={previewUrl}
                        alt="Book cover preview"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{selectedFile?.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {selectedFile ? (selectedFile.size / (1024 * 1024)).toFixed(2) + ' MB' : ''}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveImage}
                        disabled={isSubmitting}
                        className="mt-2 h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive flex items-center gap-1"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Remove image</span>
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
                      Click to upload book cover
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
                  id="book-cover-upload"
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
                {isSubmitting ? 'Adding book...' : 'Add Book Listing'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

