import type { Link, RssEntry } from '@bookmark/types';
import { isLink, generateId } from '@bookmark/validation';
import type { ParseResult, ParseError } from '../registry.js';

/**
 * Convert RSS entries to Link format
 * Separates successfully parsed links from invalid entries
 * @param entries RSS entries from workflow
 * @returns ParseResult with links and errors
 */
export async function parseRssEntries(entries: RssEntry[]): Promise<ParseResult> {
  const links: Link[] = [];
  const errors: ParseError[] = [];

  entries.forEach((entry, index) => {
    try {
      const link: Link = {
        id: generateId(),
        title: entry.title,
        url: entry.url,
        source: 'rss' as const,
        feed: entry.author,
      };

      if (isLink(link)) {
        links.push(link);
      } else {
        errors.push({
          item: entry.title,
          error: 'Invalid RSS link structure',
        });
      }
    } catch (itemError) {
      errors.push({
        item: `entry[${index}]`,
        error: itemError instanceof Error ? itemError.message : String(itemError),
        originalError: itemError instanceof Error ? itemError : undefined,
      });
    }
  });

  return {
    links,
    errors,
    success: links.length > 0 || errors.length === 0,
  };
}
