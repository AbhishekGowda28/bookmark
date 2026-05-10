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
 * React hook for searching and filtering links with fuzzy search
 * Uses pure @bookmark/search functions under the hood
 * @param links Array of Link objects to search
 * @returns Query, setQuery, results, and result count
 */
export function useSearch(links: Link[]): UseSearchReturn {
  const [query, setQuery] = useState<string>('');

  const searcher = useMemo(() => {
    return createSearcher(links);
  }, [links]);

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

export default useSearch;
