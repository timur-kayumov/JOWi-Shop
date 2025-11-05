'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Search, X, Filter } from 'lucide-react';
import { Input } from '../input';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { Loader } from '../loader';
import { SearchResults } from './search-results';
import { SearchFilters } from './search-filters';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { useSearchShortcut } from '@/hooks/useSearchShortcut';
import { SearchResult } from '@/types/search';

interface GlobalSearchProps {
  className?: string;
  currentStoreId?: string; // For resolving [storeId] placeholders in paths
}

export function GlobalSearch({ className, currentStoreId }: GlobalSearchProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const {
    query,
    setQuery,
    results,
    isLoading,
    error,
    selectedTypes,
    toggleType,
    clearFilters,
  } = useGlobalSearch();

  // Keyboard shortcut: Cmd/Ctrl + K
  useSearchShortcut(() => {
    inputRef.current?.focus();
    setIsOpen(true);
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-global-search]')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (value.trim().length >= 2) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleInputFocus = () => {
    if (query.trim().length >= 2) {
      setIsOpen(true);
    }
  };

  const handleClearQuery = () => {
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleResultClick = (result: SearchResult) => {
    // Resolve [storeId] placeholder in path
    let resolvedPath = result.path;
    if (resolvedPath.includes('[storeId]')) {
      if (currentStoreId) {
        resolvedPath = resolvedPath.replace('[storeId]', currentStoreId);
      } else if (result.metadata?.storeId) {
        resolvedPath = resolvedPath.replace('[storeId]', result.metadata.storeId);
      } else {
        // If no store context, redirect to intranet
        resolvedPath = '/intranet';
      }
    }

    router.push(resolvedPath);
    setIsOpen(false);
    setQuery('');
  };

  const shouldShowDropdown = isOpen && query.trim().length >= 2;

  return (
    <div className={`relative ${className}`} data-global-search>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={t('globalSearch.placeholder')}
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          className="w-full pl-10 pr-20"
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {query && (
            <button
              onClick={handleClearQuery}
              className="rounded-md p-1 hover:bg-gray-100"
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`rounded-md p-1 transition-colors ${
              showFilters || selectedTypes.length > 0
                ? 'bg-blue-100 text-blue-600'
                : 'hover:bg-gray-100 text-gray-400'
            }`}
            aria-label="Toggle filters"
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Dropdown Panel */}
      {shouldShowDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          {showFilters && (
            <SearchFilters
              selectedTypes={selectedTypes}
              onToggleType={toggleType}
              onClearFilters={clearFilters}
            />
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader size="default" />
              <p className="mt-3 text-sm text-gray-500">{t('globalSearch.searching')}</p>
            </div>
          ) : error ? (
            <div className="px-4 py-8 text-center">
              <div className="mb-2 text-sm font-medium text-red-600">
                {t('globalSearch.error')}
              </div>
              <div className="text-xs text-gray-500">{error.message}</div>
            </div>
          ) : results ? (
            <SearchResults
              results={results}
              onResultClick={handleResultClick}
              onClose={() => setIsOpen(false)}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
