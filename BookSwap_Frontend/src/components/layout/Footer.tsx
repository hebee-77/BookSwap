import React from 'react';
import { BookOpen } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border bg-muted/30 py-8 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <BookOpen className="h-5 w-5 text-primary" />
            <span>BookSwap</span>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} BookSwap community. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
