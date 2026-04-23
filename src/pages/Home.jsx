import React from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { GuestHome } from '@/pages/GuestHome.jsx';
import { LoggedInHome } from '@/pages/LoggedInHome.jsx';
import { Skeleton } from '@/components/ui/skeleton';

export function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="space-y-8 container py-8">
        <div className="flex items-center space-x-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-40" />
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return user ? <LoggedInHome /> : <GuestHome />;
}