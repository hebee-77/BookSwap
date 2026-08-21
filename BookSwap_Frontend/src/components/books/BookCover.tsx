import React, { useState, useEffect } from 'react';
import { BookMarked } from 'lucide-react';
import { getBookImageUrl } from '../../lib/imageUtils';

interface BookCoverProps {
  imageUrl?: string | null;
  title: string;
  className?: string;
  aspect?: 'portrait' | 'landscape' | 'square' | 'wide' | 'fill' | 'auto';
  fit?: 'contain' | 'cover';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showCondition?: string;
}

export const BookCover: React.FC<BookCoverProps> = ({
  imageUrl,
  title,
  className = '',
  aspect = 'portrait',
  fit = 'contain',
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
        return 'aspect-[2/3]';
      case 'landscape':
        return 'aspect-[4/3]';
      case 'wide':
        return 'aspect-[16/10]';
      case 'square':
        return 'aspect-square';
      case 'fill':
        return 'h-full w-full';
      case 'auto':
        return 'h-auto w-full';
      default:
        return 'aspect-[2/3]';
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

  const getPaddingClass = () => {
    if (fit !== 'contain') return '';
    switch (size) {
      case 'xs':
        return 'p-0';
      case 'sm':
        return 'p-0.5';
      case 'md':
        return 'p-1.5';
      case 'lg':
        return 'p-2.5';
      case 'xl':
        return 'p-3.5';
      default:
        return 'p-1.5';
    }
  };

  const hasValidImage = Boolean(resolvedUrl && !hasError);

  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center select-none ${getAspectClass()} ${className}`}
    >
      {hasValidImage ? (
        <>
          {/* Ambient blurred backdrop matching the image colors edge-to-edge (for larger displays) */}
          {fit === 'contain' && size !== 'xs' && (
            <>
              <div
                className="absolute inset-0 bg-cover bg-center blur-2xl scale-150 saturate-150 brightness-90 opacity-80 pointer-events-none transform-gpu"
                style={{ backgroundImage: `url(${resolvedUrl})` }}
                aria-hidden="true"
              />
              <div className="absolute inset-0 bg-black/15 dark:bg-black/40 pointer-events-none" />
            </>
          )}

          {/* Main Book Cover Image Centered */}
          <div className={`relative z-10 flex items-center justify-center w-full h-full ${getPaddingClass()}`}>
            <img
              src={resolvedUrl!}
              alt={`Cover of ${title}`}
              loading="lazy"
              className={`transition-transform duration-300 group-hover:scale-105 ${
                fit === 'contain' && size !== 'xs'
                  ? 'max-h-full max-w-full h-auto w-auto object-contain rounded shadow-2xl drop-shadow-[0_10px_20px_rgba(0,0,0,0.45)]'
                  : 'h-full w-full object-cover object-top rounded-xs'
              }`}
              onError={() => setHasError(true)}
            />
          </div>
        </>
      ) : (
        /* Uniform Placeholder banner */
        <div className={`flex flex-col items-center justify-center text-center w-full h-full bg-gradient-to-br from-primary/15 via-primary/5 to-muted/60 border border-border/30 ${
          size === 'xs' || size === 'sm' ? 'p-1' : 'p-4'
        }`}>
          <BookMarked className={`${getIconSizeClass()} text-primary/50 ${size !== 'xs' && size !== 'sm' ? 'mb-1.5' : ''} transition-transform duration-200 group-hover:scale-110`} />
          {size !== 'xs' && size !== 'sm' && (
            <span className="text-xs font-bold text-foreground/80 line-clamp-1 max-w-[85%] px-1">
              {title}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
