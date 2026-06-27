import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="flex items-center space-x-3 p-4 bg-card border border-border/60 rounded-xl max-w-[200px] shadow-sm animate-pulse">
      <div className="flex space-x-1">
        <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-xs font-medium text-muted-foreground">Retrieving knowledge...</span>
    </div>
  );
};
export default Loader;
