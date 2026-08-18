import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, BookOpen, Plus } from 'lucide-react';
import { Button } from '../ui/button';

interface EmptySwapRequestsProps {
  type: 'received' | 'sent' | 'history';
}

export const EmptySwapRequests: React.FC<EmptySwapRequestsProps> = ({ type }) => {
  const getContent = () => {
    switch (type) {
      case 'received':
        return {
          title: 'No Incoming Swap Requests',
          desc: "You don't have any pending exchange proposals for your books yet. When another user requests to swap one of your listed books, it will appear here.",
          ctaText: 'List More Books',
          ctaLink: '/books/new',
          icon: <Plus className="h-4 w-4" />,
        };
      case 'sent':
        return {
          title: 'No Outgoing Swap Requests',
          desc: "You haven't initiated any exchange requests. Browse other shelves, find something you want to read, and propose a swap!",
          ctaText: 'Browse Books',
          ctaLink: '/books',
          icon: <BookOpen className="h-4 w-4" />,
        };
      case 'history':
        return {
          title: 'No Swap History',
          desc: 'Your completed, accepted, or rejected exchange activity will appear here once requests are processed.',
          ctaText: 'Explore Shelf',
          ctaLink: '/books',
          icon: <ArrowLeftRight className="h-4 w-4" />,
        };
    }
  };

  const content = getContent();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-border rounded-2xl bg-card shadow-sm max-w-lg mx-auto my-8">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
        <ArrowLeftRight className="h-8 w-8" />
      </div>
      <h3 className="text-xl font-bold text-foreground">{content.title}</h3>
      <p className="text-muted-foreground mt-2 mb-6 text-sm max-w-sm">
        {content.desc}
      </p>
      
      <Link to={content.ctaLink}>
        <Button className="flex items-center gap-2">
          {content.icon}
          <span>{content.ctaText}</span>
        </Button>
      </Link>
    </div>
  );
};
