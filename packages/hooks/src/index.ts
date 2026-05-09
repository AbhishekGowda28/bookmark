import { useMemo, useState } from 'react';
import type { Link } from '@bookmark/types';
import Fuse from 'fuse.js';

/**
 * Hook for searching and filtering links with fuzzy search
 * @param links Array of Link objects to search
 * @returns Query, setQuery, results, and result count
 */
export function useSearch(links: Link[]) {
  const [query, setQuery] = useState('');

  const fuse = useMemo(() => {
    return new Fuse(links, {
      keys: ['title', 'url'],
      threshold: 0.3,
      minMatchCharLength: 1,
    });
  }, [links]);

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

export default useSearch;
