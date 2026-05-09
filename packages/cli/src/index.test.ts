import { test } from 'node:test';
import assert from 'node:assert';
import { generate, loadConfig, loadRssEntries, loadXbelFile } from './index.js';
import type { Config, RssEntry } from '@bookmark/types';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

test('loadConfig - reads and validates config', () => {
  const testConfig: Config = {
    feeds: [
      {
        id: 'test-feed',
        author: 'Test Author',
        authorMaxEntries: 10,
        sources: [
          {
            url: 'https://example.com/feed',
            schedule: 'daily',
            maxEntries: 5,
          },
        ],
      },
    ],
  };

  // Create temporary file
  const tmpDir = join('/tmp', `bookmark-test-${Date.now()}`);
  mkdirSync(tmpDir, { recursive: true });
  const configPath = join(tmpDir, 'feeds.json');
  writeFileSync(configPath, JSON.stringify(testConfig));

  try {
    const loaded = loadConfig(configPath);
    assert.strictEqual(loaded.feeds.length, 1);
    assert.strictEqual(loaded.feeds[0].author, 'Test Author');
  } finally {
    rmSync(tmpDir, { recursive: true });
  }
});

test('loadConfig - throws on invalid config', () => {
  const tmpDir = join('/tmp', `bookmark-test-${Date.now()}`);
  mkdirSync(tmpDir, { recursive: true });
  const configPath = join(tmpDir, 'feeds.json');
  writeFileSync(configPath, JSON.stringify({ invalid: 'config' }));

  try {
    assert.throws(() => {
      loadConfig(configPath);
    });
  } finally {
    rmSync(tmpDir, { recursive: true });
  }
});

test('loadRssEntries - reads RSS entries', () => {
  const testEntries: RssEntry[] = [
    {
      author: 'TechNews',
      title: 'Article 1',
      url: 'https://example.com/1',
      date: '2024-01-15',
    },
  ];

  const tmpDir = join('/tmp', `bookmark-test-${Date.now()}`);
  mkdirSync(tmpDir, { recursive: true });
  const entriesPath = join(tmpDir, 'rss-entries.json');
  writeFileSync(entriesPath, JSON.stringify(testEntries));

  try {
    const loaded = loadRssEntries(entriesPath);
    assert.strictEqual(loaded.length, 1);
    assert.strictEqual(loaded[0].author, 'TechNews');
  } finally {
    rmSync(tmpDir, { recursive: true });
  }
});

test('loadRssEntries - returns empty array if file not found', () => {
  const loaded = loadRssEntries('/nonexistent/path.json');
  assert.strictEqual(loaded.length, 0);
});

test('loadXbelFile - parses XBEL content', async () => {
  const xbelContent = `<?xml version="1.0" encoding="UTF-8"?>
<xbel version="1.0">
  <bookmark href="https://example.com" id="1">
    <title>Example</title>
  </bookmark>
</xbel>`;

  const tmpDir = join('/tmp', `bookmark-test-${Date.now()}`);
  mkdirSync(tmpDir, { recursive: true });
  const xbelPath = join(tmpDir, 'bookmarks.xbel');
  writeFileSync(xbelPath, xbelContent);

  try {
    const links = await loadXbelFile(xbelPath);
    assert.strictEqual(links.length, 1);
    assert.strictEqual(links[0].url, 'https://example.com');
  } finally {
    rmSync(tmpDir, { recursive: true });
  }
});

test('loadXbelFile - returns empty array if file not found', async () => {
  const links = await loadXbelFile('/nonexistent/path.xbel');
  assert.strictEqual(links.length, 0);
});

test('generate - aggregates links from all sources', async () => {
  const tmpDir = join('/tmp', `bookmark-test-${Date.now()}`);
  mkdirSync(tmpDir, { recursive: true });

  try {
    // Create config
    const config: Config = {
      feeds: [
        {
          id: 'test',
          author: 'Test',
          authorMaxEntries: 10,
          sources: [{ url: 'https://test.com/feed', schedule: 'daily', maxEntries: 5 }],
        },
      ],
    };
    writeFileSync(join(tmpDir, 'feeds.json'), JSON.stringify(config));

    // Create bookmarks
    const bookmarksXbel = `<?xml version="1.0"?>
<xbel version="1.0">
  <bookmark href="https://bookmark1.com" id="1">
    <title>Bookmark 1</title>
  </bookmark>
</xbel>`;
    writeFileSync(join(tmpDir, 'bookmarks.xbel'), bookmarksXbel);

    // Create tabs
    const tabsXbel = `<?xml version="1.0"?>
<xbel version="1.0">
  <bookmark href="https://tab1.com" id="1">
    <title>Tab 1</title>
  </bookmark>
</xbel>`;
    writeFileSync(join(tmpDir, 'tabs.xbel'), tabsXbel);

    // Generate
    const links = await generate(tmpDir);
    assert(links.length >= 2);
    assert(links.some((l) => l.url === 'https://bookmark1.com'));
    assert(links.some((l) => l.url === 'https://tab1.com'));
  } finally {
    rmSync(tmpDir, { recursive: true });
  }
});
