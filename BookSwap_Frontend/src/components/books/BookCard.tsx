import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import type { Book } from '../../types/book';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { useAuth } from '../../hooks/useAuth';
import { BookCover } from './BookCover';

interface BookCardProps {
  book: Book;
}

export const BookCard: React.FC<BookCardProps> = ({ book }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Color styling based on BookCondition
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

  const isOwner = user?.id === book.ownerId;
  const canRequest = book.available && !isOwner && user;

  const handleCardClick = () => {
    navigate(`/books/${book.id}`);
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="h-full cursor-pointer flex flex-col group"
      onClick={handleCardClick}
    >
      <Card className="flex flex-col h-full border border-border bg-card overflow-hidden hover:shadow-md transition-all duration-200 py-0 pt-0 gap-0">
        {/* Book Cover Banner */}
        <div className="w-full border-b border-border/80 overflow-hidden">
          <BookCover
            imageUrl={book.imageUrl}
            title={book.title}
            aspect="wide"
            fit="contain"
            size="lg"
            className="w-full rounded-none"
          />
        </div>

        <CardHeader className="p-5 pt-4 pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-bold text-foreground leading-tight line-clamp-1">
              {book.title}
            </CardTitle>
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase shrink-0 ${getConditionStyles(book.bookCondition)}`}>
              {book.bookCondition}
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-semibold line-clamp-1">by {book.author}</p>
        </CardHeader>

        <CardContent className="flex-grow px-5 py-2">
          <p className="text-muted-foreground text-xs line-clamp-2 leading-relaxed font-medium">
            {book.description || 'No description provided.'}
          </p>
        </CardContent>

        {/* Buttons / Actions block */}
        <div className="px-5 py-3 flex gap-2 border-t border-border/40 bg-muted/5" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/books/${book.id}`)}
            className="flex-1 font-semibold text-xs h-8 rounded-lg"
          >
            Details
          </Button>
          {canRequest && (
            <Button
              size="sm"
              onClick={() => navigate(`/books/${book.id}`)}
              className="flex-1 font-bold text-xs h-8 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-1 shadow-sm"
            >
              <span>Swap</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          )}
        </div>

        <CardFooter className="flex items-center justify-between border-t border-border p-4 bg-muted/20 text-[10px] text-muted-foreground font-bold mt-auto">
          <div className="flex items-center gap-1 min-w-0 pr-2">
            <User className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
            <span className="truncate max-w-[120px]">{book.ownerName || `OWNER #${book.ownerId}`}</span>
          </div>
          
          <div className="flex items-center gap-1">
            {book.available ? (
              <span className="inline-flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500/10" />
                <span>AVAILABLE</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-muted-foreground/75">
                <XCircle className="h-3.5 w-3.5 text-muted-foreground/50" />
                <span>UNAVAILABLE</span>
              </span>
            )}
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
