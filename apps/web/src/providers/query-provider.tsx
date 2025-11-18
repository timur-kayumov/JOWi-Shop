'use client';

/**
 * TanStack Query provider for managing server state
 * Provides caching, automatic refetching, and optimistic updates
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create a new QueryClient instance per component instance
  // This ensures that data is not shared between different users and requests
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: data is considered fresh for 5 minutes
            staleTime: 5 * 60 * 1000,
            // Cache time: data stays in cache for 10 minutes
            gcTime: 10 * 60 * 1000,
            // Retry failed requests 1 time
            retry: 1,
            // Refetch on window focus (useful for keeping data up-to-date)
            refetchOnWindowFocus: false,
            // Refetch on reconnect
            refetchOnReconnect: true,
          },
          mutations: {
            // Retry failed mutations 1 time
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* React Query DevTools (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom"
          buttonPosition="bottom-left"
        />
      )}
    </QueryClientProvider>
  );
}
