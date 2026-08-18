import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, BookMarked } from 'lucide-react';
import type { Book } from '../../types/book';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';

interface BookCardProps {
  book: Book;
}

export const BookCard: React.FC<BookCardProps> = ({ book }) => {
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

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="h-full"
    >
      <Link to={`/books/${book.id}`} className="block h-full">
        <Card className="flex flex-col h-full border border-border bg-card overflow-hidden hover:shadow-md transition-shadow">
          {/* Subtle placeholder cover layout */}
          <div className="aspect-[16/9] w-full bg-gradient-to-br from-primary/10 to-primary/5 border-b border-border flex items-center justify-center p-4">
            <BookMarked className="h-12 w-12 text-primary/40" />
          </div>

          <CardHeader className="p-5 pb-2">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-lg font-bold text-foreground leading-tight line-clamp-1">
                {book.title}
              </CardTitle>
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold uppercase ${getConditionStyles(book.bookCondition)}`}>
                {book.bookCondition}
              </span>
            </div>
            <p className="text-sm text-muted-foreground font-medium line-clamp-1">by {book.author}</p>
          </CardHeader>

          <CardContent className="flex-grow px-5 py-2">
            <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
              {book.description || 'No description provided.'}
            </p>
          </CardContent>

          <CardFooter className="flex items-center justify-between border-t border-border p-5 bg-muted/20 text-xs text-muted-foreground mt-auto">
            <div className="flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-muted-foreground/60" />
              <span>Owner #{book.ownerId}</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${book.available ? 'bg-emerald-500' : 'bg-rose-400'}`} />
              <span>{book.available ? 'Available' : 'Swapped'}</span>
            </div>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
};
