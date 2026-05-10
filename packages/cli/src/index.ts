import type { Link, RssEntry, Config } from '@bookmark/types';
import { parseXbel, parseRssEntries } from '@bookmark/parsers';
import { combine } from '@bookmark/core';
import { validateConfig } from '@bookmark/schema';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Load configuration from feeds.json
 * @param configPath Path to feeds.json
 * @returns Validated Config object
 */
export function loadConfig(configPath: string): Config {
  try {
    const content = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(content);
    return validateConfig(config);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid config schema')) {
      console.error(`Failed to load config from ${configPath}:`, error.message);
    } else {
      console.error(`Failed to load config from ${configPath}:`, error);
    }
    throw error;
  }
}

/**
 * Load RSS entries from rss-entries.json
 * @param entriesPath Path to rss-entries.json
 * @returns Array of RssEntry objects
 */
export function loadRssEntries(entriesPath: string): RssEntry[] {
  try {
    const content = readFileSync(entriesPath, 'utf-8');
    return JSON.parse(content) as RssEntry[];
  } catch {
    // If file doesn't exist yet, return empty array
    return [];
  }
}

/**
 * Parse XBEL file from path
 * @param filePath Path to XBEL file
 * @returns Array of Link objects
 */
export async function loadXbelFile(filePath: string): Promise<Link[]> {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return await parseXbel(content);
  } catch (error) {
    console.warn(`Failed to load XBEL from ${filePath}:`, error);
    return [];
  }
}

/**
 * Main orchestration function for link aggregation
 * Reads from multiple sources, merges, deduplicates, and outputs
 * @param projectRoot Root directory of the project
 * @returns Promise<Link[]> - Aggregated and deduplicated links
 */
export async function generate(projectRoot: string = process.cwd()): Promise<Link[]> {
  try {
    // Note: Config is loaded but not currently used. Kept for future RSS feed filtering.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const config = loadConfig(join(projectRoot, 'feeds.json'));

    // Load links from various sources
    const bookmarksPath = join(projectRoot, 'bookmarks.xbel');
    const tabsPath = join(projectRoot, 'tabs.xbel');
    const rssEntriesPath = join(projectRoot, 'rss-entries.json');

    console.log('📚 Loading bookmarks from XBEL...');
    const bookmarks = await loadXbelFile(bookmarksPath);
    console.log(`   Found ${bookmarks.length} bookmarks`);

    console.log('📑 Loading tabs from XBEL...');
    const tabs = await loadXbelFile(tabsPath);
    console.log(`   Found ${tabs.length} tabs`);

    console.log('📡 Loading RSS entries...');
    const rssEntriesData = loadRssEntries(rssEntriesPath);
    const rssLinks = parseRssEntries(rssEntriesData);
    console.log(`   Found ${rssLinks.length} RSS entries`);

    // Combine all sources
    console.log('🔀 Merging and deduplicating...');
    const allLinks = combine([bookmarks, tabs, rssLinks]);
    console.log(`   Total unique links: ${allLinks.length}`);

    return allLinks;
  } catch (error) {
    console.error('Error during generation:', error);
    throw error;
  }
}

export default {
  generate,
  loadConfig,
  loadRssEntries,
  loadXbelFile,
};
