import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';

interface ImageLightboxProps {
  imageUrl: string | null;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-md">
        <div
          className="absolute inset-0 cursor-pointer"
          onClick={onClose}
          aria-label="Close image preview overlay"
        />

        {/* Top Control bar */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="inline-flex"
          >
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full shadow-lg bg-background/80 backdrop-blur"
              title="Open full size"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </a>
          <Button
            size="icon"
            variant="secondary"
            onClick={onClose}
            className="rounded-full shadow-lg bg-background/80 backdrop-blur"
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Image Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 max-h-[85vh] max-w-[90vw] overflow-hidden rounded-xl shadow-2xl border border-border bg-card"
        >
          <img
            src={imageUrl}
            alt="Expanded preview"
            className="h-auto max-h-[85vh] w-auto max-w-[90vw] object-contain select-none"
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
