import type { Link, RssEntry } from '@bookmark/types';
/**
 * Parse XBEL (XML Bookmark Exchange Language) format
 * Recursively walks the DOM tree and extracts all bookmarks
 * @param content XBEL XML string
 * @returns Array of Link objects
 */
export declare function parseXbel(content: string): Promise<Link[]>;
/**
 * Parse Markdown format and extract links
 * Uses markdown-it to tokenize and find all links
 * @param content Markdown string
 * @returns Array of Link objects
 */
export declare function parseMarkdown(content: string): Link[];
/**
 * Convert RSS entries to Link format
 * @param entries RSS entries from workflow
 * @returns Array of Link objects
 */
export declare function parseRssEntries(entries: RssEntry[]): Link[];
declare const _default: {
  parseXbel: typeof parseXbel;
  parseMarkdown: typeof parseMarkdown;
  parseRssEntries: typeof parseRssEntries;
};
export default _default;
//# sourceMappingURL=index.d.ts.map
