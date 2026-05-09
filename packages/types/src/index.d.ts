export interface Link {
  id: string;
  title: string;
  url: string;
  source: 'bookmark' | 'rss';
  feed?: string;
}
export interface Feed {
  id: string;
  author: string;
  authorMaxEntries: number;
  sources: FeedSource[];
}
export interface FeedSource {
  url: string;
  schedule: 'daily' | 'weekly' | 'monthly';
  maxEntries: number;
}
export interface RssEntry {
  author: string;
  title: string;
  url: string;
  date: string;
}
export interface Config {
  feeds: Feed[];
}
//# sourceMappingURL=index.d.ts.map
