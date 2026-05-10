import type { Link, RssEntry } from '@bookmark/types';

/**
 * Discriminated union for parsers
 * Each parser knows its input type and handles it accordingly
 */
export type Parser =
  | {
      /** Parser for file-based formats (XBEL, JSON, Markdown) */
      type: 'file';
      name: string;
      parse(content: string): Promise<Link[]>;
    }
  | {
      /** Parser for structured data (RSS entries) */
      type: 'entries';
      name: string;
      parse(entries: RssEntry[]): Promise<Link[]>;
    };

/**
 * Registry for managing multiple parsers
 * Routes format names to appropriate parser implementations
 */
export interface Registry {
  /**
   * Parse input based on format
   * Automatically routes to correct parser type
   * @param format Format identifier (e.g., 'xbel', 'json', 'rss')
   * @param input Input to parse (string for files, RssEntry[] for entries)
   * @returns Array of parsed Link objects
   * @throws Error if format is unknown or parsing fails
   */
  parse(format: string, input: string | RssEntry[]): Promise<Link[]>;
}

/**
 * Type guard to check if input is a string (file-based format)
 */
export function isFileInput(input: string | RssEntry[]): input is string {
  return typeof input === 'string';
}

/**
 * Type guard to check if input is an array of RssEntry objects
 */
export function isEntriesInput(input: string | RssEntry[]): input is RssEntry[] {
  return Array.isArray(input);
}

/**
 * Create a new parser registry with provided parsers
 * @param parsers Map of format name to Parser
 * @returns Registry instance
 */
export function createParserRegistry(
  parsers: Map<string, Parser> = new Map()
): Registry {
  return {
    async parse(format: string, input: string | RssEntry[]): Promise<Link[]> {
      const parser = parsers.get(format.toLowerCase());
      if (!parser) {
        throw new Error(`Unknown parser format: ${format}`);
      }

      // Route to correct parser based on input type
      if (isFileInput(input)) {
        if (parser.type !== 'file') {
          throw new Error(`Format '${format}' expects file input (string), got array`);
        }
        return parser.parse(input);
      } else if (isEntriesInput(input)) {
        if (parser.type !== 'entries') {
          throw new Error(`Format '${format}' expects entries input (array), got string`);
        }
        return parser.parse(input);
      }

      throw new Error(`Invalid input type for format '${format}'`);
    },
  };
}
