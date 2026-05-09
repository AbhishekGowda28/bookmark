import { useSearch } from '../hooks/useSearch.js';

export default function SearchableList({ links }) {
  const { query, setQuery, results, resultCount } = useSearch(links);

  return (
    <div className="searchable-list">
      {/* Search Input */}
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search links by title or URL..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search links"
        />
        {query && (
          <span className="search-count">
            {resultCount} result{resultCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Results List */}
      <div className="results-container">
        {resultCount === 0 && query ? (
          <div className="no-results">
            <p>No results found for "{query}"</p>
            <p className="no-results-hint">Try different keywords</p>
          </div>
        ) : (
          <div className="results-list">
            {results.map((link) => (
              <div key={link.id} className="result-item">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="result-title"
                >
                  {link.title}
                </a>
                <div className="result-footer">
                  <span className="result-url" title={link.url}>
                    {link.url}
                  </span>
                  <span className={`result-badge badge-${link.source}`}>
                    {link.source === 'rss' ? `RSS: ${link.feed}` : 'Bookmark'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
