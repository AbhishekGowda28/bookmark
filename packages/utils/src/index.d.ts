import type { Link, Feed, Config } from '@bookmark/types';
/**
 * Check if two links are duplicates (same URL)
 * @param link1 First link
 * @param link2 Second link
 * @returns true if links have same URL
 */
export declare function isDuplicate(link1: Link, link2: Link): boolean;
/**
 * Normalize URL for comparison (remove trailing slash, lowercase)
 * @param url URL to normalize
 * @returns Normalized URL
 */
export declare function normalizeUrl(url: string): string;
/**
 * Validate a Link object
 * @param link Object to validate
 * @returns true if valid Link
 */
export declare function validateLink(link: unknown): link is Link;
/**
 * Validate a Feed object
 * @param feed Object to validate
 * @returns true if valid Feed
 */
export declare function validateFeed(feed: unknown): feed is Feed;
/**
 * Validate a Config object
 * @param config Object to validate
 * @returns true if valid Config
 */
export declare function validateConfig(config: unknown): config is Config;
/**
 * Format URL for display
 * @param url URL to format
 * @returns Formatted URL (hostname + path)
 */
export declare function formatUrl(url: string): string;
/**
 * Format date string
 * @param date Date to format
 * @returns Formatted date string
 */
export declare function formatDate(date: string | Date): string;
/**
 * Generate UUID v4
 * @returns Generated UUID
 */
export declare function generateId(): string;
/**
 * Ensure Link has valid ID
 * @param link Link to normalize
 * @returns Link with guaranteed ID
 */
export declare function ensureLink(link: Partial<Link>): Link;
//# sourceMappingURL=index.d.ts.map
