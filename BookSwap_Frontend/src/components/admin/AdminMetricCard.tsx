import React from 'react';
import { Card, CardContent } from '../ui/card';

interface AdminMetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  isLoading?: boolean;
}

export const AdminMetricCard: React.FC<AdminMetricCardProps> = ({
  label,
  value,
  icon,
  description,
  isLoading = false,
}) => {
  return (
    <Card className="overflow-hidden border border-border/80 shadow-md hover:shadow-lg transition-all duration-200 bg-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
          <div className="p-2 bg-primary/10 rounded-xl text-primary">{icon}</div>
        </div>
        <div className="mt-4 space-y-1">
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-8 w-24 bg-muted animate-pulse rounded-md" />
              {description && <div className="h-4 w-36 bg-muted animate-pulse rounded-md" />}
            </div>
          ) : (
            <>
              <h3 className="text-3xl font-extrabold text-foreground tracking-tight">{value}</h3>
              {description && <p className="text-xs font-semibold text-muted-foreground">{description}</p>}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
