import React from 'react';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const LoadingFallback = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] w-full p-8 animate-in fade-in duration-300">
      <Loader2 className="w-10 h-10 animate-spin text-primary mb-6" />
      <div className="w-full max-w-4xl space-y-6">
        <Skeleton className="h-12 w-3/4 max-w-md mx-auto rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl hidden lg:block" />
        </div>
      </div>
    </div>
  );
};

export default LoadingFallback;