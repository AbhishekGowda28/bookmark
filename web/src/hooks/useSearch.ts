import { useMemo, useState } from 'react';
import type { Link } from '@bookmark/types';
import { createSearcher, search } from '@bookmark/search';
import type { SearchOptions } from '@bookmark/search';

interface UseSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: Link[];
  resultCount: number;
  searchOptions: SearchOptions;
  setSearchOptions: (options: SearchOptions) => void;
}

/**
 * Hook for searching through links with configurable options
 * 
 * @param links Array of Link objects to search through
 * @param defaultOptions Optional default search configuration (threshold, limit, etc.)
 * @returns Search state, results, and options control
 * 
 * @example
 * const { results, query, setQuery, searchOptions, setSearchOptions } = useSearch(links, {
 *   threshold: 0.5,
 *   limit: 100
 * });
 */
export function useSearch(
  links: Link[], 
  defaultOptions?: SearchOptions
): UseSearchReturn {
  const [query, setQuery] = useState<string>('');
  const [searchOptions, setSearchOptions] = useState<SearchOptions>(
    defaultOptions ?? {}
  );

  // Initialize search index using @bookmark/search pure function
  const searcher = useMemo(() => {
    return createSearcher(links, searchOptions);
  }, [links, searchOptions]);

  // Perform search using @bookmark/search pure function
  const results = useMemo(() => {
    return search(searcher, query, searchOptions);
  }, [query, searcher, searchOptions]);

  return {
    query,
    setQuery,
    results,
    resultCount: results.length,
    searchOptions,
    setSearchOptions,
  };
}
