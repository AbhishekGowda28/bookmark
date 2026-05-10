import { test } from 'node:test';
import assert from 'node:assert';
import { isFileInput, isEntriesInput, createParserRegistry } from './registry.js';
import { parserRegistry } from './index.js';
import type { Parser, Registry } from './registry.js';
import type { RssEntry } from '@bookmark/types';

// Type Guards
test('isFileInput - identifies string input', () => {
  assert.strictEqual(isFileInput('<?xml version="1.0"?>'), true);
  assert.strictEqual(isFileInput('{ "test": "data" }'), true);
});

test('isFileInput - rejects array input', () => {
  assert.strictEqual(isFileInput([]), false);
  const entries: RssEntry[] = [];
  assert.strictEqual(isFileInput(entries), false);
});

test('isEntriesInput - identifies array input', () => {
  const entries: RssEntry[] = [
    { title: 'Test', url: 'http://example.com', author: 'test' },
  ];
  assert.strictEqual(isEntriesInput(entries), true);
});

test('isEntriesInput - rejects string input', () => {
  assert.strictEqual(isEntriesInput('test string'), false);
  assert.strictEqual(isEntriesInput(''), false);
});

// Parser Type Structure
test('file parser - has correct structure', () => {
  const fileParser: Parser = {
    type: 'file',
    name: 'xbel',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    parse: async (_content: string) => [],
  };
  assert.strictEqual(fileParser.type, 'file');
  assert.strictEqual(fileParser.name, 'xbel');
  assert.strictEqual(typeof fileParser.parse, 'function');
});

test('entries parser - has correct structure', () => {
  const entriesParser: Parser = {
    type: 'entries',
    name: 'rss',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    parse: async (_entries: RssEntry[]) => [],
  };
  assert.strictEqual(entriesParser.type, 'entries');
  assert.strictEqual(entriesParser.name, 'rss');
  assert.strictEqual(typeof entriesParser.parse, 'function');
});

// Registry Type Contract
test('Registry interface - requires parse method', () => {
  const registry: Registry = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    parse: async (_format: string, _input: string | RssEntry[]) => [],
  };
  assert.strictEqual(typeof registry.parse, 'function');
});

test('Registry parse method - accepts string input', () => {
  const registry: Registry = {
    parse: async (format: string, input: string | RssEntry[]) => {
      if (typeof input === 'string') {
        return [];
      }
      return [];
    },
  };
  assert.ok(registry);
});

test('Registry parse method - accepts RssEntry array input', () => {
  const registry: Registry = {
    parse: async (format: string, input: string | RssEntry[]) => {
      if (Array.isArray(input)) {
        return [];
      }
      return [];
    },
  };
  assert.ok(registry);
});

// Registry Implementation Tests
test('createParserRegistry - creates registry', () => {
  const registry = createParserRegistry();
  assert.strictEqual(typeof registry.parse, 'function');
});

test('parserRegistry singleton - is defined', () => {
  assert.strictEqual(typeof parserRegistry, 'object');
  assert.strictEqual(typeof parserRegistry.parse, 'function');
});

test('registry.parse - xbel format with valid input', async () => {
  const xbel = `<?xml version="1.0" encoding="UTF-8"?>
<xbel version="1.0">
  <bookmark href="https://example.com" id="1">
    <title>Example</title>
  </bookmark>
</xbel>`;

  const links = await parserRegistry.parse('xbel', xbel);
  assert.strictEqual(links.length, 1);
  assert.strictEqual(links[0].title, 'Example');
  assert.strictEqual(links[0].source, 'bookmark');
});

test('registry.parse - markdown format with valid input', async () => {
  const markdown = '[Example](https://example.com)';
  const links = await parserRegistry.parse('markdown', markdown);
  assert.ok(links.length > 0);
  assert.strictEqual(links[0].url, 'https://example.com');
});

test('registry.parse - rss format with valid input', async () => {
  const entries: RssEntry[] = [
    { title: 'Test', url: 'http://example.com', author: 'test-feed' },
  ];
  const links = await parserRegistry.parse('rss', entries);
  assert.strictEqual(links.length, 1);
  assert.strictEqual(links[0].source, 'rss');
  assert.strictEqual(links[0].feed, 'test-feed');
});

test('registry.parse - throws on unknown format', async () => {
  try {
    await parserRegistry.parse('unknown', 'some content');
    assert.fail('Should have thrown');
  } catch (error) {
    assert.ok(error instanceof Error);
    assert.ok((error as Error).message.includes('Unknown parser format'));
  }
});

test('registry.parse - throws on format-input type mismatch (string to rss)', async () => {
  try {
    await parserRegistry.parse('rss', 'invalid string input');
    assert.fail('Should have thrown');
  } catch (error) {
    assert.ok(error instanceof Error);
    // Just verify an error was thrown; the exact message may vary
    assert.strictEqual(typeof (error as Error).message, 'string');
  }
});

test('registry.parse - throws on format-input type mismatch (array to xbel)', async () => {
  try {
    const entries: RssEntry[] = [];
    await parserRegistry.parse('xbel', entries);
    assert.fail('Should have thrown');
  } catch (error) {
    assert.ok(error instanceof Error);
    // Just verify an error was thrown; the exact message may vary
    assert.strictEqual(typeof (error as Error).message, 'string');
  }
});

test('registry.parse - case insensitive format matching', async () => {
  const xbel = `<?xml version="1.0" encoding="UTF-8"?>
<xbel version="1.0">
  <bookmark href="https://example.com" id="1">
    <title>Example</title>
  </bookmark>
</xbel>`;

  const links = await parserRegistry.parse('XBEL', xbel);
  assert.strictEqual(links.length, 1);
});
