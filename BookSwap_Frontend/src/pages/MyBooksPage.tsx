import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Eye, Edit, Trash2, Search, SlidersHorizontal, BookCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { bookService } from '../services/bookService';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';

export const MyBooksPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'SWAPPED'>('ALL');
  const [deleteBookId, setDeleteBookId] = useState<number | null>(null);
  const [deleteBookTitle, setDeleteBookTitle] = useState('');

  // Fetch user's own books
  const { data: booksData, isLoading, isError, refetch } = useQuery({
    queryKey: ['user-books', user?.id],
    queryFn: () => bookService.getBooksByOwner(user!.id),
    enabled: !!user?.id,
  });

  const books = booksData?.content || [];
  const totalCount = booksData?.totalElements || 0;
  const availableCount = books.filter((b) => b.available).length;
  const swappedCount = totalCount - availableCount;

  // Mutation for deleting a book
  const deleteMutation = useMutation({
    mutationFn: (id: number) => bookService.deleteBook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-books', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success('Book removed from shelf');
      setDeleteBookId(null);
    },
    onError: (err: any) => {
      console.error('Delete error:', err);
      const msg = err.response?.data?.message || 'Failed to delete book';
      toast.error(msg);
      setDeleteBookId(null);
    },
  });

  const handleDeleteConfirm = () => {
    if (deleteBookId) {
      deleteMutation.mutate(deleteBookId);
    }
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

  // Perform client-side filter for owned books
  const filteredBooks = books.filter((book) => {
    const matchesKeyword =
      book.title.toLowerCase().includes(keyword.toLowerCase()) ||
      book.author.toLowerCase().includes(keyword.toLowerCase()) ||
      (book.isbn && book.isbn.includes(keyword));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'AVAILABLE' && book.available) ||
      (statusFilter === 'SWAPPED' && !book.available);

    return matchesKeyword && matchesStatus;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 bg-background relative">
      {/* Title Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">My Bookshelf</h1>
          <p className="text-muted-foreground mt-1">Manage and track your active book listings.</p>
        </div>
        <Link to="/books/new">
          <Button className="flex items-center gap-2 shadow-sm font-semibold">
            <Plus className="h-4 w-4" />
            <span>Add Book</span>
          </Button>
        </Link>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">My Listings</CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold text-foreground">{isLoading ? '...' : totalCount}</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Active Available</CardTitle>
            <BookCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold text-foreground">{isLoading ? '...' : availableCount}</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Swapped Out</CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold text-foreground">{isLoading ? '...' : swappedCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between mb-8 bg-card border border-border p-5 rounded-2xl shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground pointer-events-none">
            <Search className="h-4 w-4" />
          </div>
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search your shelf by title, author, or ISBN..."
            className="pl-9"
          />
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2">
          {(['ALL', 'AVAILABLE', 'SWAPPED'] as const).map((filter) => {
            const isActive = statusFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                type="button"
                className={`px-4 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                  isActive
                    ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {filter === 'ALL' ? 'All Books' : filter === 'AVAILABLE' ? 'Available' : 'Swapped'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Shelves View */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <SlidersHorizontal className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Syncing bookshelf details...</p>
        </div>
      ) : isError ? (
        <div className="text-center py-16">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-bold text-foreground">Failed to Load Shelf</h3>
          <Button onClick={() => refetch()} variant="outline" className="mt-4">
            Retry Sync
          </Button>
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-16 px-4 border border-dashed border-border rounded-2xl bg-card shadow-sm max-w-lg mx-auto my-8">
          <BookOpen className="mx-auto h-14 w-14 text-muted-foreground/60 mb-4" />
          <h3 className="text-xl font-bold text-foreground">Your bookshelf is empty</h3>
          <p className="text-muted-foreground mt-2 mb-6 text-sm max-w-sm">
            List your read books to join the community exchange economy.
          </p>
          <div className="flex justify-center gap-3">
            <Link to="/books/new">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span>Add Your First Book</span>
              </Button>
            </Link>
            <Link to="/books">
              <Button variant="outline">Browse Others</Button>
            </Link>
          </div>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-border rounded-xl">
          <p className="text-muted-foreground text-sm">No matches found for your filter criteria.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/50 font-semibold text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 text-left">Title</th>
                  <th className="px-6 py-4 text-left">Author</th>
                  <th className="px-6 py-4 text-left">ISBN</th>
                  <th className="px-6 py-4 text-left">Condition</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card text-foreground">
                {filteredBooks.map((book) => (
                  <tr key={book.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-bold">{book.title}</td>
                    <td className="px-6 py-4 text-muted-foreground">{book.author}</td>
                    <td className="px-6 py-4 text-muted-foreground">{book.isbn || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold uppercase ${getConditionStyles(book.bookCondition)}`}>
                        {book.bookCondition}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${book.available ? 'text-emerald-600' : 'text-rose-500'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${book.available ? 'bg-emerald-500' : 'bg-rose-400'}`} />
                        {book.available ? 'Available' : 'Swapped'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/books/${book.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link to={`/books/${book.id}/edit`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDeleteBookId(book.id);
                            setDeleteBookTitle(book.title);
                          }}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Grid View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredBooks.map((book) => (
              <Card key={book.id} className="border border-border bg-card">
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-base font-bold text-foreground line-clamp-1">{book.title}</CardTitle>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${getConditionStyles(book.bookCondition)}`}>
                      {book.bookCondition}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">by {book.author}</p>
                </CardHeader>
                <CardContent className="p-4 pt-0 pb-2 text-xs text-muted-foreground">
                  <div className="flex justify-between py-2 border-t border-border mt-2">
                    <span>ISBN: {book.isbn || 'N/A'}</span>
                    <span className={`font-semibold ${book.available ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {book.available ? 'Available' : 'Swapped'}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-2 border-t border-border flex justify-end gap-2">
                  <Link to={`/books/${book.id}`}>
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <Eye className="h-4 w-4 mr-1.5" />
                      <span>View</span>
                    </Button>
                  </Link>
                  <Link to={`/books/${book.id}/edit`}>
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <Edit className="h-4 w-4 mr-1.5" />
                      <span>Edit</span>
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDeleteBookId(book.id);
                      setDeleteBookTitle(book.title);
                    }}
                    className="h-8 px-2 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    <span>Delete</span>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Delete Confirmation Modal Overlay */}
      <AnimatePresence>
        {deleteBookId !== null && (
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
                  <CardDescription className="pt-2 text-foreground font-semibold">
                    Are you sure you want to delete **"{deleteBookTitle}"**?
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground leading-relaxed">
                  This action is destructive and cannot be undone. This book listing will be permanently removed from your shelf.
                </CardContent>
                <CardFooter className="flex justify-end gap-3 border-t border-border pt-4">
                  <Button variant="outline" onClick={() => setDeleteBookId(null)} disabled={deleteMutation.isPending}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteConfirm}
                    disabled={deleteMutation.isPending}
                    className="flex items-center gap-1.5"
                  >
                    {deleteMutation.isPending ? 'Removing...' : 'Confirm Remove'}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
