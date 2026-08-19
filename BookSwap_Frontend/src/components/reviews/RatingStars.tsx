import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxRating = 5,
  interactive = false,
  onChange,
  size = 'md',
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-7 w-7',
  };

  const currentRating = hoverRating !== null ? hoverRating : rating;

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (!interactive || !onChange) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(index);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[...Array(maxRating)].map((_, i) => {
        const starIndex = i + 1;
        const isFilled = starIndex <= currentRating;

        if (interactive) {
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange?.(starIndex)}
              onMouseEnter={() => setHoverRating(starIndex)}
              onMouseLeave={() => setHoverRating(null)}
              onKeyDown={(e) => handleKeyDown(e, starIndex)}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md p-0.5 transition-transform hover:scale-110"
              aria-label={`${starIndex} out of ${maxRating} stars`}
            >
              <Star
                className={`${sizeClasses[size]} ${
                  isFilled ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'
                }`}
              />
            </button>
          );
        }

        return (
          <Star
            key={i}
            className={`${sizeClasses[size]} ${
              isFilled ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'
            }`}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
};
