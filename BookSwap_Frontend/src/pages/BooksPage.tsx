import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { bookService } from '../services/bookService';
import type { BookCondition } from '../types/book';
import { BookCard } from '../components/books/BookCard';
import { BookSkeleton } from '../components/books/BookSkeleton';
import { BookSearch } from '../components/books/BookSearch';
import { BookFilters } from '../components/books/BookFilters';
import { BookSort } from '../components/books/BookSort';
import { BookFilterChips } from '../components/books/BookFilterChips';
import { BookPagination } from '../components/books/BookPagination';
import { EmptyBooks } from '../components/books/EmptyBooks';
import { Button } from '../components/ui/button';

export const BooksPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Extract query parameters from URL with defaults
  const keyword = searchParams.get('keyword') || '';
  const condition = (searchParams.get('condition') as BookCondition | '') || '';
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const direction = (searchParams.get('direction') as 'asc' | 'desc') || 'desc';
  const page = Number(searchParams.get('page')) || 0;
  const showOnlyAvailable = searchParams.get('available') === 'true';

  const size = 6; // items per page

  // Fetch books matching current search state (excluding client-side available filter)
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['books', page, keyword, condition, sortBy, direction],
    queryFn: () =>
      bookService.getBooks({
        page,
        size,
        keyword: keyword || undefined,
        condition: condition || undefined,
        sortBy,
        direction,
      }),
  });

  // URL State Updates
  const updateParams = (newParams: Record<string, string | number | boolean | null | undefined>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, val]) => {
      if (val === undefined || val === '' || val === null || val === false) {
        next.delete(key);
      } else {
        next.set(key, String(val));
      }
    });
    setSearchParams(next);
  };

  const handleSearchChange = (val: string) => {
    updateParams({ keyword: val, page: 0 }); // reset page on search
  };

  const handleConditionChange = (cond: BookCondition | '') => {
    updateParams({ condition: cond, page: 0 }); // reset page on filter change
  };

  const handleSortChange = (newSortBy: string, newDirection: 'asc' | 'desc') => {
    updateParams({ sortBy: newSortBy, direction: newDirection, page: 0 }); // reset page on sort change
  };

  const handleAvailabilityToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateParams({ available: e.target.checked ? true : null });
  };

  const handlePageChange = (newPage: number) => {
    updateParams({ page: newPage });
  };

  const handleClearFilters = () => {
    setSearchParams(new URLSearchParams()); // clear all
  };

  const content = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;

  // Filter content client-side for availability as backend doesn't support it
  const filteredContent = showOnlyAvailable ? content.filter((b) => b.available) : content;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 bg-background animate-in fade-in duration-300">
      {/* Title Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">Browse Shelf</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Discover available books shared by our community.
          </p>
        </div>
        {isAuthenticated && (
          <Link to="/books/new">
            <Button className="flex items-center gap-2 self-start sm:self-auto shadow-sm font-bold rounded-xl">
              <Plus className="h-4.5 w-4.5" />
              <span>Add Book</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Advanced Search & Filter Controls */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end mb-8 bg-card border border-border p-6 rounded-2xl shadow-md">
        {/* Search Input */}
        <div className="flex-1 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Search Books</span>
          <BookSearch value={keyword} onChange={handleSearchChange} isLoading={isFetching} />
        </div>

        {/* Condition Filter */}
        <div className="lg:w-auto">
          <BookFilters selectedCondition={condition} onConditionChange={handleConditionChange} />
        </div>

        {/* Sorting Dropdown */}
        <div className="lg:w-48">
          <BookSort sortBy={sortBy} direction={direction} onSortChange={handleSortChange} />
        </div>

        {/* Availability Toggle */}
        <div className="flex items-center gap-2 lg:mb-3">
          <input
            id="avail-toggle"
            type="checkbox"
            checked={showOnlyAvailable}
            onChange={handleAvailabilityToggle}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
          />
          <label htmlFor="avail-toggle" className="text-xs font-bold text-foreground cursor-pointer select-none">
            Only Available
          </label>
        </div>
      </div>

      {/* Active Filter Chips */}
      <BookFilterChips
        keyword={keyword}
        condition={condition}
        showOnlyAvailable={showOnlyAvailable}
        onRemoveKeyword={() => updateParams({ keyword: null, page: 0 })}
        onRemoveCondition={() => updateParams({ condition: null, page: 0 })}
        onRemoveAvailability={() => updateParams({ available: null })}
        onClearAll={handleClearFilters}
      />

      {/* Main Listing View */}
      <div className="mt-8">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: size }).map((_, idx) => (
              <BookSkeleton key={idx} />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-16 bg-card border border-border rounded-2xl shadow-sm">
            <SlidersHorizontal className="mx-auto h-12 w-12 text-destructive/80 mb-4 animate-bounce" />
            <h3 className="text-lg font-bold text-foreground">Failed to Load Shelf</h3>
            <p className="text-muted-foreground mt-1 mb-6 text-sm">
              Something went wrong while connecting to the BookSwap API. Please check your connection.
            </p>
            <Button onClick={() => refetch()} variant="outline" className="font-semibold rounded-xl">
              Try Again
            </Button>
          </div>
        ) : filteredContent.length === 0 ? (
          <EmptyBooks onClear={handleClearFilters} showAdd={isAuthenticated} />
        ) : (
          <div className="space-y-8">
            {/* Results Count Info */}
            <div className="flex justify-between items-center text-xs font-bold text-muted-foreground px-1 uppercase tracking-wider">
              <span>
                Showing {filteredContent.length} of {totalElements} books
              </span>
              {showOnlyAvailable && (
                <span className="text-[10px] text-emerald-600 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 rounded-md">
                  Filtered: Available Only
                </span>
              )}
            </div>

            {/* Book Cards Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredContent.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>

            {/* Shared Reusable Pagination */}
            <BookPagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};
