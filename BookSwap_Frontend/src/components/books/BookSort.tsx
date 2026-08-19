import React from 'react';
import { ArrowUpDown } from 'lucide-react';

interface BookSortProps {
  sortBy: string;
  direction: 'asc' | 'desc';
  onSortChange: (sortBy: string, direction: 'asc' | 'desc') => void;
}

export const BookSort: React.FC<BookSortProps> = ({
  sortBy,
  direction,
  onSortChange,
}) => {
  const options: { label: string; sortBy: string; direction: 'asc' | 'desc' }[] = [
    { label: 'Recently Added', sortBy: 'createdAt', direction: 'desc' },
    { label: 'Oldest Added', sortBy: 'createdAt', direction: 'asc' },
    { label: 'Title: A to Z', sortBy: 'title', direction: 'asc' },
    { label: 'Title: Z to A', sortBy: 'title', direction: 'desc' },
    { label: 'Author: A to Z', sortBy: 'author', direction: 'asc' },
    { label: 'Author: Z to A', sortBy: 'author', direction: 'desc' },
  ];

  const currentValue = `${sortBy}-${direction}`;

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = options.find((opt) => `${opt.sortBy}-${opt.direction}` === e.target.value);
    if (selected) {
      onSortChange(selected.sortBy, selected.direction);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="sort-select" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
        <ArrowUpDown className="h-3.5 w-3.5" />
        <span>Sort Results</span>
      </label>
      <select
        id="sort-select"
        value={currentValue}
        onChange={handleSelectChange}
        className="w-full text-xs font-bold text-foreground bg-background border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
      >
        {options.map((opt) => (
          <option key={`${opt.sortBy}-${opt.direction}`} value={`${opt.sortBy}-${opt.direction}`}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};
