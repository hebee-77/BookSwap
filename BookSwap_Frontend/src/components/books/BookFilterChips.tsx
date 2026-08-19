import React from 'react';
import { X } from 'lucide-react';
import type { BookCondition } from '../../types/book';

interface BookFilterChipsProps {
  keyword: string;
  condition: BookCondition | '';
  showOnlyAvailable: boolean;
  onRemoveKeyword: () => void;
  onRemoveCondition: () => void;
  onRemoveAvailability: () => void;
  onClearAll: () => void;
}

export const BookFilterChips: React.FC<BookFilterChipsProps> = ({
  keyword,
  condition,
  showOnlyAvailable,
  onRemoveKeyword,
  onRemoveCondition,
  onRemoveAvailability,
  onClearAll,
}) => {
  const hasActiveFilters = !!keyword || !!condition || showOnlyAvailable;

  if (!hasActiveFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mt-4 text-xs font-semibold animate-in fade-in duration-200">
      <span className="text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
        Active Filters:
      </span>

      {/* Keyword Chip */}
      {keyword && (
        <span className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-lg">
          <span>Search: "{keyword}"</span>
          <button
            onClick={onRemoveKeyword}
            className="hover:bg-primary/20 p-0.5 rounded transition-colors"
            aria-label="Remove search filter"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      )}

      {/* Condition Chip */}
      {condition && (
        <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2.5 py-1 rounded-lg">
          <span>Condition: {condition}</span>
          <button
            onClick={onRemoveCondition}
            className="hover:bg-amber-500/20 p-0.5 rounded transition-colors"
            aria-label="Remove condition filter"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      )}

      {/* Availability Chip */}
      {showOnlyAvailable && (
        <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
          <span>Available Only</span>
          <button
            onClick={onRemoveAvailability}
            className="hover:bg-emerald-500/20 p-0.5 rounded transition-colors"
            aria-label="Remove availability filter"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      )}

      {/* Clear All button */}
      <button
        onClick={onClearAll}
        className="text-[11px] font-extrabold text-muted-foreground hover:text-foreground underline transition-colors px-1 py-0.5"
      >
        Clear all filters
      </button>
    </div>
  );
};
