import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookX, Home } from 'lucide-react';
import { Button } from '../components/ui/button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 text-center bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center max-w-md gap-6"
      >
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
          <BookX className="h-10 w-10" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">Page Not Found</h1>
        <p className="text-muted-foreground text-base sm:text-lg">
          Sorry, we couldn't find the page you are looking for. Perhaps it was shelf-shuffled or doesn't exist.
        </p>
        <Link to="/">
          <Button className="flex items-center gap-2 mt-2 h-10 px-5">
            <Home className="h-4 w-4" />
            <span>Back to Home</span>
          </Button>
        </Link>
      </motion.div>
    </div>
  );
};
