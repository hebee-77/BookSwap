import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookService } from '../../services/bookService';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Search,
  Filter,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  BookOpen,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import type { BookCondition } from '../../types/book';

export const AdminBooksPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Search/Filter states
  const [keyword, setKeyword] = useState('');
  const [condition, setCondition] = useState<BookCondition | ''>('');
  const [sortBy, setSortBy] = useState<'title' | 'author' | 'createdAt'>('createdAt');
  const [direction, setDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const size = 5;

  // Active query parameters (apply on search click or debounced input, here we update state immediately on inputs, but keyword can be applied on submit/keypress for a better UX)
  const [appliedKeyword, setAppliedKeyword] = useState('');

  // Fetch books
  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['admin-books', appliedKeyword, condition, sortBy, direction, page],
    queryFn: () =>
      bookService.getBooks({
        page,
        size,
        sortBy,
        direction,
        keyword: appliedKeyword || undefined,
        condition: condition || undefined,
      }),
  });

  // Delete book mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => bookService.deleteBook(id),
    onSuccess: () => {
      toast.success('Book deleted successfully');
      // Invalidate queries to refresh list
      queryClient.invalidateQueries({ queryKey: ['admin-books'] });
      queryClient.invalidateQueries({ queryKey: ['admin-books-count'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['user-books'] });
      queryClient.invalidateQueries({ queryKey: ['admin-exchanges'] });
    },
    onError: (error: any) => {
      // Map backend error responses
      const errorMessage =
        error.response?.data?.message ||
        (error.response?.status === 400
          ? 'This book cannot be deleted because it has an existing exchange history.'
          : 'Failed to delete book. Please try again.');
      toast.error(errorMessage);
    },
  });

  const books = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setAppliedKeyword(keyword);
  };

  const handleClearSearch = () => {
    setKeyword('');
    setAppliedKeyword('');
    setPage(0);
  };

  const handleConditionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCondition(e.target.value as BookCondition | '');
    setPage(0);
  };

  const handleSortChange = (field: 'title' | 'author' | 'createdAt') => {
    if (sortBy === field) {
      setDirection(direction === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setDirection('desc');
    }
    setPage(0);
  };

  const handleDeleteBook = (id: number, title: string) => {
    if (window.confirm(`Are you sure you want to delete the book "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Platform Books</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Explore and manage all books cataloged on the platform.
        </p>
      </div>

      <Card className="border border-border/80 shadow-md">
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-foreground">Catalog Management</CardTitle>
              <CardDescription>
                Admins can delete any book (unless blocked by accepted/rejected exchange requests). Admins can edit their own books.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Topbar */}
          <div className="flex flex-col md:flex-row gap-4 justify-between bg-muted/20 p-4 rounded-xl border border-border/50">
            {/* Search Form */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 max-w-lg">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by title or author..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full pl-9.5 pr-4 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                />
              </div>
              <Button type="submit" size="sm" className="font-semibold rounded-xl">
                Search
              </Button>
              {appliedKeyword && (
                <Button type="button" variant="ghost" size="sm" onClick={handleClearSearch} className="font-semibold text-xs rounded-xl">
                  Clear
                </Button>
              )}
            </form>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                <Filter className="h-3.5 w-3.5" />
                <span>Filter:</span>
              </div>
              <select
                value={condition}
                onChange={handleConditionChange}
                className="text-xs font-bold text-foreground bg-background border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">All Conditions</option>
                <option value="NEW">New</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setPage(0);
                }}
                className="text-xs font-bold text-foreground bg-background border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="createdAt">Date Created</option>
                <option value="title">Book Title</option>
                <option value="author">Author Name</option>
              </select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setDirection(direction === 'asc' ? 'desc' : 'asc');
                  setPage(0);
                }}
                className="h-8.5 w-8.5 rounded-xl"
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Books List Content */}
          {isLoading ? (
            <div className="space-y-3 py-4">
              {[...Array(5)].map((_, idx) => (
                <div key={idx} className="h-16 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : isError ? (
            <div className="py-8 text-center text-sm font-semibold text-destructive">
              Error fetching catalog data. Please try again.
            </div>
          ) : books.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm font-semibold">
              No books found matching criteria.
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="py-3.5 px-4 cursor-pointer hover:text-foreground" onClick={() => handleSortChange('title')}>
                        Title {sortBy === 'title' && (direction === 'asc' ? '▲' : '▼')}
                      </th>
                      <th className="py-3.5 px-4 cursor-pointer hover:text-foreground" onClick={() => handleSortChange('author')}>
                        Author {sortBy === 'author' && (direction === 'asc' ? '▲' : '▼')}
                      </th>
                      <th className="py-3.5 px-4">Condition</th>
                      <th className="py-3.5 px-4">Owner ID</th>
                      <th className="py-3.5 px-4">Availability</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {books.map((book) => {
                      const isOwner = user?.id === book.ownerId;
                      return (
                        <tr key={book.id} className="hover:bg-muted/30 transition-colors group">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4.5 w-4.5 text-primary shrink-0" />
                              <span className="font-bold text-foreground">{book.title}</span>
                            </div>
                            {book.isbn && <span className="text-[10px] text-muted-foreground font-semibold ml-6.5 block">ISBN: {book.isbn}</span>}
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground font-semibold">{book.author}</td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                              book.bookCondition === 'NEW'
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                : book.bookCondition === 'GOOD'
                                ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                : book.bookCondition === 'FAIR'
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                : 'bg-red-500/10 text-red-500 border-red-500/20'
                            }`}>
                              {book.bookCondition}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground font-semibold">User #{book.ownerId}</td>
                          <td className="py-3.5 px-4">
                            {book.available ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500">
                                <CheckCircle className="h-4 w-4" /> Available
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                                <XCircle className="h-4 w-4" /> Exchanged
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              {isOwner && (
                                <a href={`/books/${book.id}/edit`}>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-primary/10 hover:text-primary rounded-lg"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </Button>
                                </a>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={deleteMutation.isPending}
                                onClick={() => handleDeleteBook(book.id, book.title)}
                                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive rounded-lg text-muted-foreground hover:opacity-100 opacity-80"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden space-y-3.5">
                {books.map((book) => {
                  const isOwner = user?.id === book.ownerId;
                  return (
                    <div
                      key={book.id}
                      className="p-4 rounded-xl border border-border bg-card/65 space-y-3.5"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <BookOpen className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <h3 className="font-bold text-foreground leading-tight truncate">{book.title}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">{book.author}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">
                          Owner #{book.ownerId}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 pt-1">
                        <span className={`inline-flex items-center text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                          book.bookCondition === 'NEW'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : book.bookCondition === 'GOOD'
                            ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            : book.bookCondition === 'FAIR'
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            : 'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}>
                          {book.bookCondition}
                        </span>
                        {book.available ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500">
                            <CheckCircle className="h-3.5 w-3.5" /> Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                            <XCircle className="h-3.5 w-3.5" /> Exchanged
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                        {isOwner && (
                          <a href={`/books/${book.id}/edit`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1.5 text-xs font-semibold rounded-lg"
                            >
                              <Edit2 className="h-3 w-3" />
                              <span>Edit</span>
                            </Button>
                          </a>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deleteMutation.isPending}
                          onClick={() => handleDeleteBook(book.id, book.title)}
                          className="h-8 gap-1.5 text-xs font-bold text-destructive hover:bg-destructive/10 rounded-lg"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Delete</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border/60 pt-4">
                  <span className="text-xs text-muted-foreground font-semibold">
                    Showing <strong className="text-foreground">{page * size + 1}</strong> to{' '}
                    <strong className="text-foreground">
                      {Math.min((page + 1) * size, totalElements)}
                    </strong>{' '}
                    of <strong className="text-foreground">{totalElements}</strong> books
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={page === 0}
                      onClick={() => setPage(page - 1)}
                      className="h-8 w-8 rounded-lg"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center text-xs font-bold px-3">
                      Page {page + 1} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage(page + 1)}
                      className="h-8 w-8 rounded-lg"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
