import type { Link, RssEntry } from '@bookmark/types';
import { parserRegistry } from '@bookmark/parsers';
import { combine } from '@bookmark/core';
import { validateConfig } from '@bookmark/validation';
import { typedPipeline } from '@bookmark/pipeline';
import type { Step } from '@bookmark/pipeline';
import type { AggregationData } from './pipeline-context.js';
import { createAggregationData } from './pipeline-context.js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Re-export pipeline context types as public API
export type { AggregationData } from './pipeline-context.js';
export { isAggregationData, createAggregationData } from './pipeline-context.js';

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
 * Parse XBEL file from path using the parser registry
 * @param filePath Path to XBEL file
 * @returns Array of Link objects
 */
export async function loadXbelFile(filePath: string): Promise<Link[]> {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return await parserRegistry.parse('xbel', content);
  } catch (error) {
    console.warn(`Failed to load XBEL from ${filePath}:`, error);
    return [];
  }
}

// ============= Pipeline Steps (Composition Pattern) =============

/**
 * Step 1: Initialize pipeline with project root
 */
class InitializeStep implements Step<string, AggregationData> {
  name = 'Initialize';

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
class LoadConfigurationStep implements Step<AggregationData, AggregationData> {
  name = 'LoadConfiguration';

  async execute(data: AggregationData): Promise<AggregationData> {
    data.config = loadConfig(join(data.projectRoot, 'feeds.json'));
    return data;
  }
}

/**
 * Step 3: Load bookmarks from XBEL
 */
class LoadBookmarksStep implements Step<AggregationData, AggregationData> {
  name = 'LoadBookmarks';

  async execute(data: AggregationData): Promise<AggregationData> {
    console.log('📚 Loading bookmarks from XBEL...');
    try {
      const content = readFileSync(join(data.projectRoot, 'bookmarks.xbel'), 'utf-8');
      data.bookmarks = await parserRegistry.parse('xbel', content);
    } catch (error) {
      console.warn(`Failed to load bookmarks:`, error);
      data.bookmarks = [];
    }
    console.log(`   Found ${data.bookmarks.length} bookmarks`);
    return data;
  }
}

/**
 * Step 4: Load tabs from XBEL
 */
class LoadTabsStep implements Step<AggregationData, AggregationData> {
  name = 'LoadTabs';

  async execute(data: AggregationData): Promise<AggregationData> {
    console.log('📑 Loading tabs from XBEL...');
    try {
      const content = readFileSync(join(data.projectRoot, 'tabs.xbel'), 'utf-8');
      data.tabs = await parserRegistry.parse('xbel', content);
    } catch (error) {
      console.warn(`Failed to load tabs:`, error);
      data.tabs = [];
    }
    console.log(`   Found ${data.tabs.length} tabs`);
    return data;
  }
}

/**
 * Step 5: Load RSS entries and convert to links
 */
class LoadRssStep implements Step<AggregationData, AggregationData> {
  name = 'LoadRss';

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
class MergeLinksStep implements Step<AggregationData, Link[]> {
  name = 'MergeLinks';

  async execute(data: AggregationData): Promise<Link[]> {
    console.log('🔀 Merging and deduplicating...');
    const rssLinks = await parserRegistry.parse('rss', data.rssEntries);
    const allLinks = combine([data.bookmarks, data.tabs, rssLinks]);
    console.log(`   Total unique links: ${allLinks.length}`);
    return allLinks;
  }
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
