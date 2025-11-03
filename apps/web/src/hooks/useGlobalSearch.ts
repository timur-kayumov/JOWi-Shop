import { useState, useEffect, useCallback } from 'react';
import { SearchResults, SearchEntityType } from '@/types/search';
import Fuse from 'fuse.js';

interface UseGlobalSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
}

export function useGlobalSearch(options: UseGlobalSearchOptions = {}) {
  const { debounceMs = 300, minQueryLength = 2 } = options;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<SearchEntityType[]>([]);

  const search = useCallback(
    async (searchQuery: string, types: SearchEntityType[] = []) => {
      if (searchQuery.length < minQueryLength) {
        setResults(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          query: searchQuery,
        });

        if (types.length > 0) {
          types.forEach((type) => params.append('types', type));
        }

        const response = await fetch(`/api/search?${params.toString()}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Search request failed');
        }

        const data: SearchResults = await response.json();
        setResults(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setResults(null);
      } finally {
        setIsLoading(false);
      }
    },
    [minQueryLength]
  );

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        search(query, selectedTypes);
      } else {
        setResults(null);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [query, selectedTypes, debounceMs, search]);

  const toggleType = (type: SearchEntityType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSelectedTypes([]);
  };

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    selectedTypes,
    toggleType,
    clearFilters,
  };
}
