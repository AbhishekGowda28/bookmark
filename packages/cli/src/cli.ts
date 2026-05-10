#!/usr/bin/env node

import { generate, loadConfig, createAggregationData, getConfig } from './index.js';
import { FetchRssStep } from './steps/FetchRssStep.js';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { typedPipeline } from '@bookmark/pipeline';
import type { Step } from '@bookmark/pipeline';
import type { AggregationData } from './pipeline-context.js';

/**
 * Parse CLI arguments into structured options
 */
function parseArgs(args: string[]): {
  command: 'fetch' | 'aggregate' | 'help';
  feedId?: string;
  dryRun: boolean;
  verbose: boolean;
} {
  const command = args[0] as 'fetch' | 'aggregate' | 'help' | undefined;
  const result = {
    command: (command && ['fetch', 'aggregate', 'help'].includes(command)) ? command : 'aggregate' as const,
    feedId: undefined as string | undefined,
    dryRun: false,
    verbose: false,
  };

  // If first arg wasn't a command, it might be flags
  const argsToProcess = command && ['fetch', 'aggregate', 'help'].includes(command) ? args.slice(1) : args;

  for (let i = 0; i < argsToProcess.length; i++) {
    const arg = argsToProcess[i];
    if (arg === '--feed' && argsToProcess[i + 1]) {
      result.feedId = argsToProcess[i + 1];
      i++;
    } else if (arg === '--dry-run') {
      result.dryRun = true;
    } else if (arg === '--verbose') {
      result.verbose = true;
    }
  }

  return result;
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
📖 Bookmark CLI - Link Aggregation Tool

USAGE:
  npx bookmark [command] [options]

COMMANDS:
  fetch              Fetch RSS feeds from configured sources
  aggregate          Full aggregation (bookmarks + tabs + RSS)
  help               Show this help message

FETCH OPTIONS:
  --feed <id>        Filter to specific feed (by feed.id)
  --dry-run          Preview without saving output
  --verbose          Show detailed output

AGGREGATE OPTIONS:
  None currently

EXAMPLES:
  npx bookmark fetch --verbose
  npx bookmark fetch --feed my-tech-blog --dry-run
  npx bookmark aggregate
`);
}

/**
 * Initialize pipeline with project root
 */
class InitializeStep implements Step<string, AggregationData> {
  name = 'Initialize';
  async execute(projectRoot: string): Promise<AggregationData> {
    return createAggregationData(projectRoot);
  }
}

/**
 * Load configuration step
 */
class LoadConfigurationStep implements Step<AggregationData, AggregationData> {
  name = 'LoadConfiguration';
  async execute(data: AggregationData): Promise<AggregationData> {
    data.config = loadConfig(join(data.projectRoot, 'feeds.json'));
    return data;
  }
}

/**
 * Validate configuration step
 */
class ValidateConfigStep implements Step<AggregationData, AggregationData> {
  name = 'ValidateConfig';
  async execute(data: AggregationData): Promise<AggregationData> {
    console.log('✓ Validating configuration...');
    try {
      const config = getConfig(data);

      if (!config.feeds || config.feeds.length === 0) {
        throw new Error('Config must have at least one feed');
      }

      for (const feed of config.feeds) {
        if (!feed.sources || feed.sources.length === 0) {
          throw new Error(`Feed "${feed.id}" must have at least one source`);
        }
        if (feed.authorMaxEntries < 1) {
          throw new Error(`Feed "${feed.id}" authorMaxEntries must be at least 1`);
        }
      }

      console.log(`   ✅ Config valid: ${config.feeds.length} feed(s) configured`);
      return data;
    } catch (error) {
      console.error('❌ Configuration validation failed:', error);
      throw error;
    }
  }
}

/**
 * Execute the fetch command
 * Runs FetchRssStep to fetch configured RSS feeds
 */
async function fetchCommand(options: { feedId?: string; dryRun: boolean; verbose: boolean }) {
  const projectRoot = process.cwd();

  try {
    console.log('🚀 Fetching RSS feeds...\n');

    // Initialize pipeline
    const result = await typedPipeline<string>()
      .addStep(new InitializeStep() as Step<string, AggregationData>)
      .addStep(new LoadConfigurationStep() as Step<AggregationData, AggregationData>)
      .addStep(new ValidateConfigStep() as Step<AggregationData, AggregationData>)
      .addStep(new FetchRssStep() as Step<AggregationData, AggregationData>)
      .execute(projectRoot, { verbose: options.verbose });

    if (!result.success) {
      throw new Error(`Pipeline failed: ${result.errors.map((e) => e.message).join(', ')}`);
    }

    const data = result.data as AggregationData;

    // Filter by specific feed if requested
    let linksToProcess = data.links || [];
    if (options.feedId) {
      linksToProcess = linksToProcess.filter((link) => link.feed === options.feedId);
      console.log(`\n📌 Filtered to feed "${options.feedId}": ${linksToProcess.length} links`);
    }

    if (!options.dryRun) {
      // Write rss-entries.json (future use for full aggregation)
      const entriesPath = join(projectRoot, 'rss-entries.json');
      writeFileSync(entriesPath, JSON.stringify(data.links || [], null, 2));
      console.log(`\n✅ Wrote ${linksToProcess.length} links to rss-entries.json`);
    } else {
      console.log(`\n🔍 DRY-RUN: Would have written ${linksToProcess.length} links (no changes saved)`);
    }

    console.log('✨ RSS fetch complete!\n');
  } catch (error) {
    console.error('❌ RSS fetch failed:', error);
    process.exit(1);
  }
}

/**
 * Execute the aggregate command (full pipeline)
 */
async function aggregateCommand() {
  const projectRoot = process.cwd();

  try {
    console.log('🚀 Starting full link aggregation...\n');

    // Generate aggregated links
    const links = await generate(projectRoot);

    // Write data.json
    const dataPath = join(projectRoot, 'data.json');
    writeFileSync(dataPath, JSON.stringify(links, null, 2));
    console.log(`\n✅ Wrote ${links.length} links to data.json`);

    console.log('✨ Link aggregation complete!\n');
  } catch (error) {
    console.error('❌ Link aggregation failed:', error);
    process.exit(1);
  }
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (options.command === 'help') {
    showHelp();
    return;
  }

  if (options.command === 'fetch') {
    await fetchCommand(options);
  } else {
    await aggregateCommand();
  }
}

main();
