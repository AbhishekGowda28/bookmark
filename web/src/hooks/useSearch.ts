import { useMemo, useState } from 'react';
import type { Link } from '@bookmark/types';
import Fuse from 'fuse.js';

interface UseSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: Link[];
  resultCount: number;
}

/**
 * Hook for searching through links using Fuse.js fuzzy search
 * @param links Array of Link objects to search through
 * @returns Search state and results
 */
export function useSearch(links: Link[]): UseSearchReturn {
  const [query, setQuery] = useState<string>('');

  // Initialize Fuse.js index with links
  const fuse = useMemo(() => {
    return new Fuse(links, {
      keys: ['title', 'url'],
      threshold: 0.3,
      minMatchCharLength: 1,
    });
  }, [links]);

  // Perform search
  const results = useMemo(() => {
    if (!query.trim()) {
      return links;
    }

    const searchResults = fuse.search(query);
    return searchResults.map((result) => result.item);
  }, [query, fuse, links]);

  return {
    query,
    setQuery,
    results,
    resultCount: results.length,
  };
}
