import React, { useState, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '../ui/input';

interface BookSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
}

export const BookSearch: React.FC<BookSearchProps> = ({
  value,
  onChange,
  placeholder = 'Search by title or author...',
  isLoading = false,
}) => {
  const [localValue, setLocalValue] = useState(value);

  // Sync internal value with outer value prop
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounce the change callback
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, 450);

    return () => {
      clearTimeout(handler);
    };
  }, [localValue, onChange, value]);

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground pointer-events-none">
        {isLoading ? (
          <Loader2 className="h-4.5 w-4.5 animate-spin text-primary" />
        ) : (
          <Search className="h-4.5 w-4.5" />
        )}
      </div>

      <Input
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        type="text"
        placeholder={placeholder}
        className="pl-10.5 pr-10 w-full h-11 border border-border focus-visible:ring-primary shadow-sm"
      />

      {localValue && (
        <button
          onClick={handleClear}
          type="button"
          className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted-foreground hover:text-foreground focus:outline-none"
          aria-label="Clear search query"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      )}
    </div>
  );
};
