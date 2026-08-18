import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, BookOpen } from 'lucide-react';
import { Button } from '../ui/button';

export const EmptyNotifications: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-border rounded-2xl bg-card shadow-sm max-w-lg mx-auto my-8">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
        <Bell className="h-8 w-8" />
      </div>
      <h3 className="text-xl font-bold text-foreground">You're all caught up</h3>
      <p className="text-muted-foreground mt-2 mb-6 text-sm max-w-sm">
        No new alerts or exchange proposals. New BookSwap notifications will appear here as the community interacts with your shelf.
      </p>
      
      <Link to="/books">
        <Button className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          <span>Browse Books</span>
        </Button>
      </Link>
    </div>
  );
};
