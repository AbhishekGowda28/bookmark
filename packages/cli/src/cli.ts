#!/usr/bin/env node

import { generate } from './index.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

/**
 * CLI entry point
 * Orchestrates link aggregation and writes output files
 */
async function main() {
  const projectRoot = process.cwd();

  try {
    console.log('🚀 Starting link aggregation...\n');

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

main();
