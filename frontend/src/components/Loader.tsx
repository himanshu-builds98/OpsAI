import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="flex space-x-1 items-center justify-center">
      <div className="w-1.5 h-1.5 bg-[#0066FF] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-1.5 h-1.5 bg-[#0066FF] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-1.5 h-1.5 bg-[#0066FF] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
};
export default Loader;

