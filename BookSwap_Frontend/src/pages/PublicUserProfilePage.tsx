import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { reviewService } from '../services/reviewService';
import { bookService } from '../services/bookService';
import { RatingStars } from '../components/reviews/RatingStars';
import { ReviewList } from '../components/reviews/ReviewList';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { User, Calendar, BookOpen, Star, AlertCircle, ArrowLeft } from 'lucide-react';
import { BookCover } from '../components/books/BookCover';

export const PublicUserProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);
  const [activeTab, setActiveTab] = useState<'reviews' | 'books'>('reviews');

  // Query 1: User Profile
  const { data: profile, isLoading: isLoadingProfile, isError: isErrorProfile } = useQuery({
    queryKey: ['public-profile', userId],
    queryFn: () => authService.getUserById(userId),
    enabled: !!userId,
  });

  // Query 2: Reviews Written for User
  const { data: reviews = [], isLoading: isLoadingReviews } = useQuery({
    queryKey: ['public-reviews', userId],
    queryFn: () => reviewService.getReviewsForUser(userId),
    enabled: !!userId,
  });

  // Query 3: Average Rating Statistics
  const { data: ratingStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['public-rating-stats', userId],
    queryFn: () => reviewService.getAverageRatingForUser(userId),
    enabled: !!userId,
  });

  // Query 4: Books Owned by User
  const { data: booksData, isLoading: isLoadingBooks } = useQuery({
    queryKey: ['public-books', userId],
    queryFn: () => bookService.getBooksByOwner(userId),
    enabled: !!userId,
  });

  const books = booksData?.content || [];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const isAnyLoading = isLoadingProfile || isLoadingReviews || isLoadingStats || isLoadingBooks;

  if (isAnyLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-muted rounded-full" />
          <div className="space-y-2">
            <div className="h-6 bg-muted rounded w-48" />
            <div className="h-4 bg-muted rounded w-36" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-muted rounded-2xl md:col-span-1" />
          <div className="h-96 bg-muted rounded-2xl md:col-span-2" />
        </div>
      </div>
    );
  }

  if (isErrorProfile || !profile) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
        <h2 className="text-xl font-extrabold text-foreground">User Not Found</h2>
        <p className="text-sm text-muted-foreground">
          The requested member profile could not be retrieved from the database.
        </p>
        <Link to="/books">
          <Button className="font-semibold text-xs rounded-xl">Back to Discover</Button>
        </Link>
      </div>
    );
  }

  // Calculate Stars Distribution (1-5)
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 5 | 4 | 3 | 2 | 1;
    distribution[star]++;
  });

  const totalReviews = reviews.length;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Back Link */}
      <Link
        to="/books"
        className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Book Catalog</span>
      </Link>

      {/* User Header Block */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-6 border-b border-border">
        <div className="h-16 w-16 bg-primary/10 text-primary border border-primary/20 rounded-full flex items-center justify-center font-extrabold text-2xl select-none uppercase shrink-0">
          {profile.name.charAt(0)}
        </div>
        <div className="text-center sm:text-left space-y-1">
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">{profile.name}</h1>
          <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-xs text-muted-foreground font-semibold">
            <div className="flex items-center gap-1.5">
              <User className="h-4 w-4 text-primary" />
              <span>User ID: #{profile.id}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary" />
              <span>Joined {formatDate(profile.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left Side: Reputation Aggregates */}
        <div className="space-y-6 md:col-span-1">
          <Card className="border border-border shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                Member Reputation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-4xl font-extrabold text-foreground tracking-tight">
                  {ratingStats?.averageRating || '0.0'}
                </h3>
                <div className="flex justify-center">
                  <RatingStars rating={Math.round(ratingStats?.averageRating || 0)} size="md" />
                </div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase">
                  Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                </p>
              </div>

              {/* Stars Progress Distribution */}
              {totalReviews > 0 && (
                <div className="border-t border-border pt-4 space-y-2.5">
                  {([5, 4, 3, 2, 1] as const).map((stars) => {
                    const count = distribution[stars];
                    const percent = Math.round((count / totalReviews) * 100);

                    return (
                      <div key={stars} className="flex items-center gap-2 text-xs font-bold">
                        <span className="w-3 text-muted-foreground">{stars}★</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="bg-amber-400 h-full rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-muted-foreground/80">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Tab Lists (Books & Reviews) */}
        <div className="md:col-span-2 space-y-6">
          {/* Tab buttons */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'reviews'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Star className="h-4.5 w-4.5 fill-current" />
              <span>Reviews ({totalReviews})</span>
            </button>
            <button
              onClick={() => setActiveTab('books')}
              className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'books'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <BookOpen className="h-4.5 w-4.5" />
              <span>Listed Books ({books.length})</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="pt-2">
            {activeTab === 'reviews' ? (
              <ReviewList reviews={reviews} />
            ) : books.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-2xl bg-muted/10 text-muted-foreground text-sm font-semibold">
                No listed books on this user's shelf.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {books.map((book) => (
                  <Link key={book.id} to={`/books/${book.id}`}>
                    <Card className="hover:shadow-md transition-shadow border border-border bg-card/50 overflow-hidden cursor-pointer flex items-center p-3 gap-3">
                      <div className="h-16 w-12 shrink-0">
                        <BookCover imageUrl={book.imageUrl} title={book.title} aspect="portrait" size="xs" className="h-16 w-12" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <h4 className="font-extrabold text-foreground text-sm leading-tight truncate">
                          {book.title}
                        </h4>
                        <p className="text-xs text-muted-foreground font-semibold truncate">
                          by {book.author}
                        </p>
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
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
