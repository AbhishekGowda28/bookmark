import type { Link, RssEntry } from '@bookmark/types';

// Re-export all parsers from modular structure
export { parseXbel, parseMarkdown, parseRssEntries } from './parsers/index.js';

// Re-export registry types and utilities
export type { Parser, Registry } from './registry.js';
export { isFileInput, isEntriesInput, createParserRegistry } from './registry.js';
import { createParserRegistry, type Parser } from './registry.js';
import { parseXbel, parseMarkdown, parseRssEntries } from './parsers/index.js';

/**
 * Global singleton registry instance
 * Pre-registers XBEL, Markdown, and RSS parsers
 */
export const parserRegistry = createParserRegistry(
  new Map<string, Parser>([
    [
      'xbel',
      {
        type: 'file',
        name: 'xbel',
        parse: parseXbel,
      },
    ],
    [
      'markdown',
      {
        type: 'file',
        name: 'markdown',
        parse: parseMarkdown,
      },
    ],
    [
      'rss',
      {
        type: 'entries',
        name: 'rss',
        parse: parseRssEntries,
      },
    ],
  ])
);

export default {
  parseXbel,
  parseMarkdown,
  parseRssEntries,
};
