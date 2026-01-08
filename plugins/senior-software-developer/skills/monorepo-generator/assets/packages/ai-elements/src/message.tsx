import * as React from 'react';
import { cn } from '@monorepo/utils';

export interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export function Message({ role, content, className, ...props }: MessageProps) {
  return (
    <div
      className={cn(
        'rounded-lg p-4',
        role === 'user' && 'bg-primary/10 ml-auto max-w-[80%]',
        role === 'assistant' && 'bg-muted mr-auto max-w-[80%]',
        role === 'system' && 'bg-yellow-100 dark:bg-yellow-900/20 text-sm',
        className
      )}
      {...props}
    >
      <div className="text-xs font-medium mb-1 opacity-70 capitalize">{role}</div>
      <div className="whitespace-pre-wrap">{content}</div>
    </div>
  );
}
