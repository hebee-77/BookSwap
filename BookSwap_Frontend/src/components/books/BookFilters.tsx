import React from 'react';
import type { BookCondition } from '../../types/book';

interface BookFiltersProps {
  selectedCondition: BookCondition | '';
  onConditionChange: (condition: BookCondition | '') => void;
}

export const BookFilters: React.FC<BookFiltersProps> = ({ selectedCondition, onConditionChange }) => {
  const conditions: { label: string; value: BookCondition | '' }[] = [
    { label: 'All Conditions', value: '' },
    { label: 'New', value: 'NEW' },
    { label: 'Good', value: 'GOOD' },
    { label: 'Fair', value: 'FAIR' },
    { label: 'Poor', value: 'POOR' },
  ];

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Filter by Condition</span>
      <div className="flex flex-wrap gap-2">
        {conditions.map((cond) => {
          const isSelected = selectedCondition === cond.value;
          return (
            <button
              key={cond.label}
              onClick={() => onConditionChange(cond.value)}
              type="button"
              className={`px-4 py-2 text-xs font-semibold rounded-full border transition-all ${
                isSelected
                  ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {cond.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
