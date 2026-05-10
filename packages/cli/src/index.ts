import type { Link, RssEntry, Config } from '@bookmark/types';
import { parseXbel, parseRssEntries } from '@bookmark/parsers';
import { combine } from '@bookmark/core';
import { validateConfig } from '@bookmark/validation';
import { AbstractStep, typedPipeline } from '@bookmark/pipeline';
import type { Step } from '@bookmark/pipeline';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Internal data structure for pipeline stages
 */
interface AggregationData {
  projectRoot: string;
  config?: Config;
  bookmarks: Link[];
  tabs: Link[];
  rssEntries: RssEntry[];
}

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

// ============= Pipeline Steps =============

/**
 * Step 1: Initialize pipeline with project root
 */
class InitializeStep extends AbstractStep<string, AggregationData> {
  constructor() {
    super('Initialize');
  }

  async execute(projectRoot: string): Promise<AggregationData> {
    return {
      projectRoot,
      bookmarks: [],
      tabs: [],
      rssEntries: [],
    };
  }
}

/**
 * Step 2: Load configuration
 */
class LoadConfigurationStep extends AbstractStep<AggregationData, AggregationData> {
  constructor() {
    super('LoadConfiguration');
  }

  async execute(data: AggregationData): Promise<AggregationData> {
    data.config = loadConfig(join(data.projectRoot, 'feeds.json'));
    return data;
  }
}

/**
 * Step 3: Load bookmarks from XBEL
 */
class LoadBookmarksStep extends AbstractStep<AggregationData, AggregationData> {
  constructor() {
    super('LoadBookmarks');
  }

  async execute(data: AggregationData): Promise<AggregationData> {
    console.log('📚 Loading bookmarks from XBEL...');
    data.bookmarks = await loadXbelFile(join(data.projectRoot, 'bookmarks.xbel'));
    console.log(`   Found ${data.bookmarks.length} bookmarks`);
    return data;
  }
}

/**
 * Step 4: Load tabs from XBEL
 */
class LoadTabsStep extends AbstractStep<AggregationData, AggregationData> {
  constructor() {
    super('LoadTabs');
  }

  async execute(data: AggregationData): Promise<AggregationData> {
    console.log('📑 Loading tabs from XBEL...');
    data.tabs = await loadXbelFile(join(data.projectRoot, 'tabs.xbel'));
    console.log(`   Found ${data.tabs.length} tabs`);
    return data;
  }
}

/**
 * Step 5: Load RSS entries and convert to links
 */
class LoadRssStep extends AbstractStep<AggregationData, AggregationData> {
  constructor() {
    super('LoadRss');
  }

  async execute(data: AggregationData): Promise<AggregationData> {
    console.log('📡 Loading RSS entries...');
    data.rssEntries = loadRssEntries(join(data.projectRoot, 'rss-entries.json'));
    console.log(`   Found ${data.rssEntries.length} RSS entries`);
    return data;
  }
}

/**
 * Step 6: Merge and deduplicate all sources
 */
class MergeLinksStep extends AbstractStep<AggregationData, Link[]> {
  constructor() {
    super('MergeLinks');
  }

  async execute(data: AggregationData): Promise<Link[]> {
    console.log('🔀 Merging and deduplicating...');
    const rssLinks = parseRssEntries(data.rssEntries);
    const allLinks = combine([data.bookmarks, data.tabs, rssLinks]);
    console.log(`   Total unique links: ${allLinks.length}`);
    return allLinks;
  }
}

/**
 * Create the aggregation pipeline
 * @returns Array of pipeline steps in execution order
 */
function createAggregationPipeline() {
  return [
    new InitializeStep(),
    new LoadConfigurationStep(),
    new LoadBookmarksStep(),
    new LoadTabsStep(),
    new LoadRssStep(),
    new MergeLinksStep(),
  ];
}

/**
 * Main orchestration function for link aggregation using typed pipeline
 * Reads from multiple sources, merges, deduplicates, and outputs
 * Uses TypedPipelineBuilder for compile-time type safety through step chain
 * @param projectRoot Root directory of the project
 * @returns Promise<Link[]> - Aggregated and deduplicated links
 */
export async function generate(projectRoot: string = process.cwd()): Promise<Link[]> {
  try {
    // Use typedPipeline for type-safe heterogeneous transformations
    // Type chain: string → AggregationData → ... → Link[]
    const result = await typedPipeline<string>()
      .addStep(new InitializeStep() as Step<string, AggregationData>)
      .addStep(new LoadConfigurationStep() as Step<AggregationData, AggregationData>)
      .addStep(new LoadBookmarksStep() as Step<AggregationData, AggregationData>)
      .addStep(new LoadTabsStep() as Step<AggregationData, AggregationData>)
      .addStep(new LoadRssStep() as Step<AggregationData, AggregationData>)
      .addStep(new MergeLinksStep() as Step<AggregationData, Link[]>)
      .execute(projectRoot);

    if (!result.success) {
      throw new Error(`Pipeline failed: ${result.errors.map((e) => e.message).join(', ')}`);
    }

    return result.data as Link[];
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
