// Re-export all parsers from modular structure
export { parseXbel, parseMarkdown, parseRssEntries } from './parsers/index.js';

// Re-export registry types and utilities
export type { Parser, Registry, ParseResult, ParseError } from './registry.js';
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
        canParse: () => true, // XBEL parser always attempts parsing
        parse: parseXbel,
      },
    ],
    [
      'markdown',
      {
        type: 'file',
        name: 'markdown',
        canParse: () => true, // Markdown parser always attempts parsing
        parse: parseMarkdown,
      },
    ],
    [
      'rss',
      {
        type: 'entries',
        name: 'rss',
        canParse: () => true, // RSS parser always attempts parsing
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
