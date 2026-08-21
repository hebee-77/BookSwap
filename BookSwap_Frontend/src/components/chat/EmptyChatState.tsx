import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquarePlus, BookOpen, ArrowLeftRight } from 'lucide-react';
import { Button } from '../ui/button';

export const EmptyChatState: React.FC = () => {
  return (
    <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center bg-card/30">
      <div className="h-20 w-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-6 shadow-xs ring-8 ring-primary/5">
        <MessageSquarePlus className="h-10 w-10" />
      </div>

      <h3 className="text-xl font-extrabold text-foreground tracking-tight">
        BookSwap Real-Time Messenger
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mt-2 mb-8 leading-relaxed">
        Select a conversation from the sidebar to chat, coordinate book exchanges, view book condition photos, and accept swap requests in real time.
      </p>

      <div className="flex items-center gap-3">
        <Link to="/books">
          <Button variant="outline" className="gap-2 text-xs font-semibold rounded-xl">
            <BookOpen className="h-4 w-4" />
            <span>Browse Books</span>
          </Button>
        </Link>
        <Link to="/swap-requests">
          <Button className="gap-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground">
            <ArrowLeftRight className="h-4 w-4" />
            <span>View Swap Requests</span>
          </Button>
        </Link>
      </div>
    </div>
  );
};
