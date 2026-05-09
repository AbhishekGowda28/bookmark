import { useMemo, useState } from 'react';
import Fuse from 'fuse.js';

export function useSearch(links) {
  const [query, setQuery] = useState('');

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
