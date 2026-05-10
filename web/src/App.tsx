import { useState, useEffect, FC } from 'react';
import type { Link } from '@bookmark/types';
import SearchableList from './components/SearchableList';

const App: FC = () => {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load data.json on component mount
    async function loadData() {
      try {
        setLoading(true);
        const dataUrl = `${import.meta.env.BASE_URL}data.json`;
        const response = await fetch(dataUrl);

        if (!response.ok) {
          throw new Error(`Failed to load data: ${response.statusText}`);
        }

        const data = await response.json();
        setLinks(data);
        setError(null);
      } catch (err) {
        console.error('Error loading data:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load links';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1>🔗 Searchable Links</h1>
        <p>Bookmarks & RSS feeds aggregated in one place</p>
      </header>

      <main className="main">
        {loading && (
          <div className="loading">
            <p>Loading links...</p>
          </div>
        )}

        {error && (
          <div className="error">
            <p>Error: {error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="content">
            <div className="stats">
              <h2>Total Links: {links.length}</h2>
            </div>
            <SearchableList links={links} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
