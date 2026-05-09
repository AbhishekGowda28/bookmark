// Link interface - represents a bookmark or RSS entry
export interface Link {
  id: string;
  title: string;
  url: string;
  source: 'bookmark' | 'rss';
  feed?: string; // Feed name (only for RSS entries)
}

// Feed configuration interface
export interface Feed {
  id: string;
  author: string;
  authorMaxEntries: number;
  sources: FeedSource[];
}

// Individual feed source
export interface FeedSource {
  url: string;
  schedule: 'daily' | 'weekly' | 'monthly';
  maxEntries: number;
}

// RSS entry from workflow
export interface RssEntry {
  author: string;
  title: string;
  url: string;
  date: string;
}

// Configuration root
export interface Config {
  feeds: Feed[];
}
