import { useMemo, useState } from 'react';
import type { Link } from '@bookmark/types';
import { createSearcher, search } from '@bookmark/search';

interface UseSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: Link[];
  resultCount: number;
}

/**
 * Hook for searching through links using pure @bookmark/search functions
 * @param links Array of Link objects to search through
 * @returns Search state and results
 */
export function useSearch(links: Link[]): UseSearchReturn {
  const [query, setQuery] = useState<string>('');

  // Initialize search index using @bookmark/search pure function
  const searcher = useMemo(() => {
    return createSearcher(links);
  }, [links]);

  // Perform search using @bookmark/search pure function
  const results = useMemo(() => {
    return search(searcher, query);
  }, [query, searcher]);

  return {
    query,
    setQuery,
    results,
    resultCount: results.length,
  };
}
