import type { Step } from '@bookmark/pipeline';
import type { Link, RssEntry } from '@bookmark/types';
import { parserRegistry } from '@bookmark/parsers';
import type { AggregationData } from '../pipeline-context.js';
import { getConfig } from '../pipeline-context.js';

const DEFAULT_TIMEOUT = 10000; // 10 seconds

/**
 * FetchRssStep: Fetch and parse RSS feeds from configured sources
 * 
 * Input Contract:
 *   - data.projectRoot: Root directory (for relative paths)
 *   - data.config: Feeds configuration with sources, schedules, limits
 * 
 * Output Contract:
 *   - Adds fetched RSS links to data.links (or appends to existing)
 *   - Collects errors in data.errors (per-feed, non-fatal)
 * 
 * Error Handling:
 *   - Per-feed errors collected, aggregation continues
 *   - Network errors logged as warnings
 *   - Invalid XML collected as parsing errors
 */
export class FetchRssStep implements Step<AggregationData, AggregationData> {
  name = 'FetchRss';
  private timeout: number;

  constructor(timeout: number = DEFAULT_TIMEOUT) {
    this.timeout = timeout;
  }

  async execute(data: AggregationData): Promise<AggregationData> {
    console.log('📡 Fetching RSS feeds...');
    
    try {
      const config = getConfig(data);
      const allFetchedLinks: Link[] = [];
      const feedErrors: Record<string, string[]> = {};

      // Process each feed
      for (const feed of config.feeds) {
        console.log(`   Fetching ${feed.author}...`);
        
        const feedLinks: Link[] = [];
        const feedErrorMessages: string[] = [];

        // Fetch from each source in the feed
        for (const source of feed.sources) {
          try {
            // Fetch RSS XML from URL
            const xml = await this.fetchWithTimeout(source.url, this.timeout);

            // Parse XML to RssEntry array
            const entries = this.parseRssXml(xml);

            // Apply per-source maxEntries limit
            const limitedEntries = entries.slice(0, source.maxEntries);

            // Parse entries to links using registry
            const parseResult = await parserRegistry.parse('rss', limitedEntries);

            // Collect successfully parsed links
            feedLinks.push(...parseResult.links);

            // Log parse errors
            if (parseResult.errors.length > 0) {
              feedErrorMessages.push(
                `${source.url}: ${parseResult.errors.length} parsing error(s)`
              );
            }
          } catch (error) {
            feedErrorMessages.push(
              `${source.url}: ${error instanceof Error ? error.message : String(error)}`
            );
          }
        }

        // Apply per-author authorMaxEntries limit
        const authorLimitedLinks = feedLinks.slice(0, feed.authorMaxEntries);

        allFetchedLinks.push(...authorLimitedLinks);

        // Track errors
        if (feedErrorMessages.length > 0) {
          feedErrors[feed.id] = feedErrorMessages;
          console.log(
            `   ⚠ ${feed.author}: ${feedErrorMessages.length} error(s), ${authorLimitedLinks.length} links fetched`
          );
        } else {
          console.log(`   ✓ ${feed.author}: ${authorLimitedLinks.length} links fetched`);
        }
      }

      // Add fetched links to aggregation data
      if (!data.links) {
        data.links = [];
      }
      data.links.push(...allFetchedLinks);

      // Record errors
      if (!data.errors) {
        data.errors = [];
      }
      
      for (const [feedId, errors] of Object.entries(feedErrors)) {
        for (const error of errors) {
          data.errors.push({
            feed: feedId,
            error,
            severity: 'warning'
          });
        }
      }

      console.log(
        `   Total fetched: ${allFetchedLinks.length} links from ${config.feeds.length} feed(s)`
      );

      return data;
    } catch (error) {
      console.error('Error in FetchRssStep:', error);
      throw error;
    }
  }

  /**
   * Fetch URL with timeout
   * @param url URL to fetch
   * @param timeout Timeout in milliseconds
   * @returns Response text
   */
  private async fetchWithTimeout(url: string, timeout: number): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.text();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Parse RSS XML string to RssEntry array
   * Currently supports basic RSS 2.0 and Atom 1.0 formats
   * @param xml RSS XML content
   * @returns Array of RssEntry objects
   */
  private parseRssXml(xml: string): RssEntry[] {
    try {
      // Parse XML
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'text/xml');

      if (doc.getElementsByTagName('parsererror').length > 0) {
        throw new Error('Invalid XML: ' + xml.substring(0, 100));
      }

      const entries: RssEntry[] = [];

      // Try RSS 2.0 format
      const rssItems = doc.getElementsByTagName('item');
      if (rssItems.length > 0) {
        for (let i = 0; i < rssItems.length; i++) {
          const item = rssItems[i];
          const title = this.getElementText(item, 'title');
          const link = this.getElementText(item, 'link');
          const author = this.getElementText(item, 'author') || 
                        this.getElementText(item, 'dc:creator') ||
                        'Unknown';
          const pubDate = this.getElementText(item, 'pubDate') ||
                         this.getElementText(item, 'published');

          if (title && link) {
            entries.push({
              author,
              title,
              url: link.trim(),
              date: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
            });
          }
        }
        return entries;
      }

      // Try Atom 1.0 format
      const atomEntries = doc.getElementsByTagName('entry');
      if (atomEntries.length > 0) {
        for (let i = 0; i < atomEntries.length; i++) {
          const entry = atomEntries[i];
          const title = this.getElementText(entry, 'title');
          const linkEl = entry.querySelector('link[rel="alternate"]') as Element | null;
          const link = linkEl?.getAttribute('href') || this.getElementText(entry, 'link');
          const author = this.getElementText(entry, 'author/name') || 'Unknown';
          const published = this.getElementText(entry, 'published') ||
                           this.getElementText(entry, 'updated');

          if (title && link) {
            entries.push({
              author,
              title,
              url: link.trim(),
              date: published ? new Date(published).toISOString() : new Date().toISOString(),
            });
          }
        }
        return entries;
      }

      return entries;
    } catch (error) {
      throw new Error(
        `Failed to parse RSS: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Helper to get text content from XML element
   * @param parent Parent element
   * @param tagName Tag name to find
   * @returns Text content or empty string
   */
  private getElementText(parent: Element, tagName: string): string {
    const element = parent.querySelector(tagName);
    return element?.textContent?.trim() || '';
  }
}

export default FetchRssStep;
