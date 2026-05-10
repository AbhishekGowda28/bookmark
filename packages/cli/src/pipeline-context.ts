import type { Link, RssEntry, Config } from '@bookmark/types';

/**
 * Pipeline execution context for link aggregation
 * 
 * This is the shared state object passed through each pipeline step.
 * Custom steps can depend on specific fields being populated by previous steps.
 * 
 * @example
 * // Custom step that depends on config being loaded
 * class CustomStep implements Step<AggregationData, AggregationData> {
 *   name = 'CustomStep';
 *   
 *   async execute(context: AggregationData): Promise<AggregationData> {
 *     // Can assume config is populated by LoadConfigurationStep
 *     if (!context.config) throw new Error('Config required');
 *     
 *     // Modify context and return it for next step
 *     return context;
 *   }
 * }
 */
export interface AggregationData {
  /**
   * Root directory of the project
   * Used to locate relative file paths (bookmarks.xbel, tabs.xbel, feeds.json, etc.)
   * 
   * **Populated by:** InitializeStep (first step, always available)
   * **Used by:** All file loading steps
   */
  projectRoot: string;

  /**
   * Loaded feed configuration from feeds.json
   * Contains per-feed and per-author entry limits
   * 
   * **Populated by:** LoadConfigurationStep
   * **Used by:** LoadRssStep, MergeLinksStep
   * **May be undefined:** If feeds.json doesn't exist or LoadConfigurationStep hasn't run yet
   */
  config?: Config;

  /**
   * Links loaded from bookmarks.xbel
   * Direct user bookmarks stored in browser export format
   * 
   * **Populated by:** LoadBookmarksStep
   * **Used by:** MergeLinksStep
   * **Initial value:** Empty array []
   */
  bookmarks: Link[];

  /**
   * Links loaded from tabs.xbel
   * Open browser tabs stored in bookmark format
   * 
   * **Populated by:** LoadTabsStep
   * **Used by:** MergeLinksStep
   * **Initial value:** Empty array []
   */
  tabs: Link[];

  /**
   * RSS entries loaded from rss-entries.json
   * Raw entry objects from RSS feeds (before conversion to Links)
   * 
   * **Populated by:** LoadRssStep
   * **Converted by:** MergeLinksStep via parserRegistry.parse('rss', ...)
   * **Initial value:** Empty array []
   */
  rssEntries: RssEntry[];
}

/**
 * Check if an object matches the AggregationData interface
 * Useful for runtime validation in custom steps
 * 
 * @param obj Object to validate
 * @returns true if obj has all required fields with correct types
 */
export function isAggregationData(obj: unknown): obj is AggregationData {
  if (typeof obj !== 'object' || obj === null) return false;

  const data = obj as Record<string, unknown>;

  return (
    typeof data.projectRoot === 'string' &&
    (data.config === undefined || typeof data.config === 'object') &&
    Array.isArray(data.bookmarks) &&
    Array.isArray(data.tabs) &&
    Array.isArray(data.rssEntries)
  );
}

/**
 * Create a new AggregationData object with default values
 * 
 * @param projectRoot Root directory path
 * @returns New AggregationData with empty arrays and no config
 */
export function createAggregationData(projectRoot: string): AggregationData {
  return {
    projectRoot,
    config: undefined,
    bookmarks: [],
    tabs: [],
    rssEntries: [],
  };
}

/**
 * Get all aggregated links from AggregationData
 * Combines bookmarks, tabs, and (eventually) RSS links after merge
 * 
 * @param data AggregationData to read from
 * @returns Array of all links currently in aggregation
 */
export function getLinks(data: AggregationData): Link[] {
  return [...data.bookmarks, ...data.tabs];
}

/**
 * Get configuration with null-safety check
 * Useful for steps that require config to be loaded
 * 
 * @param data AggregationData to read from
 * @returns Config or throws error if not loaded
 * @throws Error if config is not available
 */
export function getConfig(data: AggregationData): Config {
  if (!data.config) {
    throw new Error('Config not loaded - LoadConfigurationStep must run first');
  }
  return data.config;
}

/**
 * Get project root - always available after initialization
 * 
 * @param data AggregationData to read from
 * @returns Project root path
 */
export function getProjectRoot(data: AggregationData): string {
  return data.projectRoot;
}

export default {
  isAggregationData,
  createAggregationData,
  getLinks,
  getConfig,
  getProjectRoot,
};
