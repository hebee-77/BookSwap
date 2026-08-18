import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, SlidersHorizontal, ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { bookService } from '../services/bookService';
import type { BookCondition } from '../types/book';
import { BookCard } from '../components/books/BookCard';
import { BookSkeleton } from '../components/books/BookSkeleton';
import { BookSearch } from '../components/books/BookSearch';
import { BookFilters } from '../components/books/BookFilters';
import { EmptyBooks } from '../components/books/EmptyBooks';
import { Button } from '../components/ui/button';

export const BooksPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [condition, setCondition] = useState<BookCondition | ''>('');
  const [page, setPage] = useState(0);
  const size = 6; // 6 items per page looks excellent in 2/3-column grid

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['books', page, keyword, condition],
    queryFn: () => bookService.getBooks({ page, size, keyword, condition }),
  });

  const handleSearchChange = (val: string) => {
    setKeyword(val);
    setPage(0); // Reset page to first page on search
  };

  const handleConditionChange = (cond: BookCondition | '') => {
    setCondition(cond);
    setPage(0); // Reset page on filter change
  };

  const handleClearFilters = () => {
    setKeyword('');
    setCondition('');
    setPage(0);
  };

  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;
  const content = data?.content || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 bg-background">
      {/* Title Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Browse Shelf</h1>
          <p className="text-muted-foreground mt-1">Discover available books shared by our community.</p>
        </div>
        {isAuthenticated && (
          <Link to="/books/new">
            <Button className="flex items-center gap-2 self-start sm:self-auto shadow-sm">
              <Plus className="h-4 w-4" />
              <span>Add Book</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end mb-10 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div className="flex-1 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Search Books</span>
          <BookSearch value={keyword} onChange={handleSearchChange} />
        </div>
        <div className="lg:w-auto">
          <BookFilters selectedCondition={condition} onConditionChange={handleConditionChange} />
        </div>
      </div>

      {/* Main Listing View */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: size }).map((_, idx) => (
            <BookSkeleton key={idx} />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-16">
          <SlidersHorizontal className="mx-auto h-12 w-12 text-destructive/80 mb-4 animate-bounce" />
          <h3 className="text-lg font-bold text-foreground">Failed to Load Shelf</h3>
          <p className="text-muted-foreground mt-1 mb-6 text-sm">
            Something went wrong while connecting to the BookSwap API. Please check your connection.
          </p>
          <Button onClick={() => refetch()} variant="outline">
            Try Again
          </Button>
        </div>
      ) : content.length === 0 ? (
        <EmptyBooks onClear={handleClearFilters} showAdd={isAuthenticated} />
      ) : (
        <div className="space-y-10">
          {/* Books Count */}
          <div className="text-sm font-medium text-muted-foreground">
            Showing {content.length} of {totalElements} books
          </div>

          {/* Book Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {content.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-6 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(p - 1, 0))}
                disabled={page === 0}
                className="flex items-center gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Previous</span>
              </Button>

              <span className="text-sm font-medium text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
                disabled={page >= totalPages - 1}
                className="flex items-center gap-1.5"
              >
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
