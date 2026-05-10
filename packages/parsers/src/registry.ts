import type { Link, RssEntry } from '@bookmark/types';

/**
 * Result of parsing a single item
 * Captures either a successfully parsed link or an error
 */
export interface ParseError {
  item: string | number; // Item identifier (filename, index, title, etc.)
  error: string; // Human-readable error message
  originalError?: Error; // Original error for debugging
}

/**
 * Result of parsing a format
 * Separates successfully parsed links from errors for visibility
 */
export interface ParseResult {
  links: Link[]; // Successfully parsed links
  errors: ParseError[]; // Parsing errors (non-fatal)
  success: boolean; // true if at least some links were parsed
}

/**
 * Discriminated union for parsers
 * Each parser knows its input type and handles it accordingly
 */
export type Parser =
  | {
      /** Parser for file-based formats (XBEL, JSON, Markdown) */
      type: 'file';
      name: string;
      /**
       * Check if this parser can handle the input
       * @param content File content (or filename for format detection)
       * @returns true if this parser should attempt to parse
       */
      canParse(content: string): boolean;
      /**
       * Parse file content to links
       * @param content File content as string
       * @returns ParseResult with links and errors
       */
      parse(content: string): Promise<ParseResult>;
    }
  | {
      /** Parser for structured data (RSS entries) */
      type: 'entries';
      name: string;
      /**
       * Check if this parser can handle the input
       * @param entries Array of entries
       * @returns true if this parser should attempt to parse
       */
      canParse(entries: RssEntry[]): boolean;
      /**
       * Parse entries to links
       * @param entries Array of structured entries
       * @returns ParseResult with links and errors
       */
      parse(entries: RssEntry[]): Promise<ParseResult>;
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
   * @returns ParseResult with links and errors
   * @throws Error if format is unknown
   */
  parse(format: string, input: string | RssEntry[]): Promise<ParseResult>;

  /**
   * Register a new parser or override existing
   * @param format Format identifier (normalized to lowercase)
   * @param parser Parser implementation
   */
  add(format: string, parser: Parser): void;

  /**
   * List all registered parser formats
   * @returns Array of format names
   */
  list(): string[];

  /**
   * Look up a registered parser by format
   * @param format Format identifier
   * @returns Parser or undefined if not found
   */
  lookup(format: string): Parser | undefined;
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
  const registry = new Map(parsers);

  return {
    async parse(format: string, input: string | RssEntry[]): Promise<ParseResult> {
      const parser = registry.get(format.toLowerCase());
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

    add(format: string, parser: Parser): void {
      registry.set(format.toLowerCase(), parser);
    },

    list(): string[] {
      return Array.from(registry.keys()).sort();
    },

    lookup(format: string): Parser | undefined {
      return registry.get(format.toLowerCase());
    },
  };
}
