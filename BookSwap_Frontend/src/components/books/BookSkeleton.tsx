import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';

export const BookSkeleton: React.FC = () => {
  return (
    <Card className="flex flex-col h-full border border-border animate-pulse overflow-hidden bg-card">
      <div className="aspect-[16/9] bg-muted w-full" />
      <CardHeader className="space-y-2 p-6 pb-2">
        <div className="h-6 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
      </CardHeader>
      <CardContent className="flex-grow px-6 py-2 space-y-2">
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-5/6" />
      </CardContent>
      <CardFooter className="border-t border-border p-6 bg-muted/20">
        <div className="h-4 bg-muted rounded w-1/3" />
      </CardFooter>
    </Card>
  );
};
