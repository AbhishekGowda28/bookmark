#!/usr/bin/env node

import { generate } from './index.js';

async function main() {
  try {
    console.log('Starting link aggregation...');
    const links = await generate();
    console.log(`✓ Generated ${links.length} links`);
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error);
    process.exit(1);
  }
}

main();
