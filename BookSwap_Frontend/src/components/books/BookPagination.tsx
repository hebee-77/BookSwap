import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';

interface BookPaginationProps {
  currentPage: number; // 0-indexed
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const BookPagination: React.FC<BookPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 py-4">
      <Button
        variant="outline"
        size="icon"
        disabled={currentPage === 0}
        onClick={() => onPageChange(currentPage - 1)}
        className="h-9 w-9 rounded-xl border-border hover:bg-muted"
        aria-label="Go to previous page"
      >
        <ChevronLeft className="h-4.5 w-4.5" />
      </Button>

      <span className="text-xs font-bold text-muted-foreground select-none">
        Page <strong className="text-foreground">{currentPage + 1}</strong> of{' '}
        <strong className="text-foreground">{totalPages}</strong>
      </span>

      <Button
        variant="outline"
        size="icon"
        disabled={currentPage >= totalPages - 1}
        onClick={() => onPageChange(currentPage + 1)}
        className="h-9 w-9 rounded-xl border-border hover:bg-muted"
        aria-label="Go to next page"
      >
        <ChevronRight className="h-4.5 w-4.5" />
      </Button>
    </div>
  );
};
