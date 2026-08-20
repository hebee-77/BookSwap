import React, { useState, useEffect } from 'react';
import { BookMarked } from 'lucide-react';
import { getBookImageUrl } from '../../lib/imageUtils';

interface BookCoverProps {
  imageUrl?: string | null;
  title: string;
  className?: string;
  aspect?: 'portrait' | 'landscape' | 'square' | 'wide' | 'fill';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showCondition?: string;
}

export const BookCover: React.FC<BookCoverProps> = ({
  imageUrl,
  title,
  className = '',
  aspect = 'portrait',
  size = 'md',
}) => {
  const [hasError, setHasError] = useState(false);
  const resolvedUrl = getBookImageUrl(imageUrl);

  // Reset error state when imageUrl changes
  useEffect(() => {
    setHasError(false);
  }, [imageUrl]);

  const getAspectClass = () => {
    switch (aspect) {
      case 'portrait':
        return 'aspect-[3/4]';
      case 'landscape':
        return 'aspect-[4/3]';
      case 'wide':
        return 'aspect-[16/9]';
      case 'square':
        return 'aspect-square';
      case 'fill':
        return 'h-full w-full';
      default:
        return 'aspect-[3/4]';
    }
  };

  const getIconSizeClass = () => {
    switch (size) {
      case 'xs':
        return 'h-4 w-4';
      case 'sm':
        return 'h-6 w-6';
      case 'md':
        return 'h-10 w-10';
      case 'lg':
        return 'h-14 w-14';
      case 'xl':
        return 'h-20 w-20';
      default:
        return 'h-10 w-10';
    }
  };

  const hasValidImage = Boolean(resolvedUrl && !hasError);

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-muted to-primary/5 flex items-center justify-center border border-border select-none ${getAspectClass()} ${className}`}
    >
      {hasValidImage ? (
        <img
          src={resolvedUrl!}
          alt={`Cover of ${title}`}
          loading="lazy"
          className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          onError={() => setHasError(true)}
        />
      ) : (
        <div className="flex flex-col items-center justify-center p-3 text-center w-full h-full">
          <BookMarked className={`${getIconSizeClass()} text-primary/40 mb-1 transition-transform duration-200 group-hover:scale-110`} />
          {size !== 'xs' && size !== 'sm' && (
            <span className="text-[11px] font-semibold text-muted-foreground/70 line-clamp-1 max-w-[85%] px-1">
              {title}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
