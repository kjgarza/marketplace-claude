import * as React from 'react';
import { cn } from '@monorepo/utils';

export interface ArtifactProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  type?: 'code' | 'document' | 'image' | 'chart';
  children: React.ReactNode;
}

export function Artifact({ title, type = 'code', children, className, ...props }: ArtifactProps) {
  return (
    <div
      className={cn(
        'border rounded-lg overflow-hidden',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between px-4 py-2 bg-muted border-b">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted-foreground capitalize">{type}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
