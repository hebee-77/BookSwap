import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, RefreshCw, Plus } from 'lucide-react';
import { Button } from '../ui/button';

interface EmptyBooksProps {
  onClear?: () => void;
  showAdd?: boolean;
}

export const EmptyBooks: React.FC<EmptyBooksProps> = ({ onClear, showAdd }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-border rounded-2xl bg-card shadow-sm max-w-lg mx-auto my-8">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
        <BookOpen className="h-8 w-8" />
      </div>
      <h3 className="text-xl font-bold text-foreground">No Books Found</h3>
      <p className="text-muted-foreground mt-2 mb-6 text-sm max-w-sm">
        We couldn't find any books matching your criteria. Try adjusting your search query, clearing filters, or adding a new book to the shelf.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        {onClear && (
          <Button variant="outline" onClick={onClear} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            <span>Clear Filters</span>
          </Button>
        )}
        {showAdd && (
          <Link to="/books/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Add Your First Book</span>
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};
