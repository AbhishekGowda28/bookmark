import { test } from 'node:test';
import assert from 'node:assert';
import type { Link } from '@bookmark/types';
import { createSearcher, search, searchLinks, FUSE_CONFIG } from './index.js';

// Test data
const testLinks: Link[] = [
  {
    id: '1',
    title: 'TypeScript Documentation',
    url: 'https://www.typescriptlang.org/',
    source: 'bookmark',
    author: 'test',
    tags: ['typescript'],
    addedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'React Official Guide',
    url: 'https://react.dev/',
    source: 'bookmark',
    author: 'test',
    tags: ['react'],
    addedAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'JavaScript ES2024 Features',
    url: 'https://github.com/tc39/proposals',
    source: 'bookmark',
    author: 'test',
    tags: ['javascript'],
    addedAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Node.js Best Practices',
    url: 'https://nodejs.org/en/',
    source: 'bookmark',
    author: 'test',
    tags: ['nodejs'],
    addedAt: new Date().toISOString(),
  },
  {
    id: '5',
    title: 'Web Development Trends 2024',
    url: 'https://example.com/trends',
    source: 'rss',
    author: 'test',
    tags: ['webdev'],
    addedAt: new Date().toISOString(),
  },
];

test('createSearcher should initialize a Searcher instance', () => {
  const searcher = createSearcher(testLinks);
  assert.ok(searcher, 'Searcher should be created');
  assert.equal(searcher.constructor.name, 'Searcher', 'Should be Searcher instance');
});

test('search should return all links when query is empty', () => {
  const searcher = createSearcher(testLinks);
  const results = search(searcher, '');
  assert.equal(results.length, testLinks.length, 'Should return all links for empty query');
});

test('search should return all links when query is only whitespace', () => {
  const searcher = createSearcher(testLinks);
  const results = search(searcher, '   ');
  assert.equal(results.length, testLinks.length, 'Should return all links for whitespace query');
});

test('search should find links by title (case-insensitive)', () => {
  const searcher = createSearcher(testLinks);
  const results = search(searcher, 'typescript');
  assert.ok(results.length > 0, 'Should find TypeScript link');
  assert.ok(results.some((link) => link.id === '1'), 'Should find correct link by id');
});

test('search should be case-insensitive for partial matches', () => {
  const searcher = createSearcher(testLinks);
  const results = search(searcher, 'TYPESCRIPT');
  assert.ok(results.length > 0, 'Should find TypeScript link with uppercase query');
});

test('search should find links by partial title match', () => {
  const searcher = createSearcher(testLinks);
  const results = search(searcher, 'react');
  assert.ok(results.some((link) => link.id === '2'), 'Should find React link by partial title');
});

test('search should find links by URL', () => {
  const searcher = createSearcher(testLinks);
  const results = search(searcher, 'typescriptlang');
  assert.ok(results.length > 0, 'Should find link by URL domain');
});

test('search should return empty array for non-matching query', () => {
  const searcher = createSearcher(testLinks);
  const results = search(searcher, 'nonexistent-query-xyz');
  assert.equal(results.length, 0, 'Should return empty array for no matches');
});

test('search should preserve Link object structure', () => {
  const searcher = createSearcher(testLinks);
  const results = search(searcher, 'typescript');
  assert.ok(results.length > 0, 'Should find results');
  const result = results[0];
  assert.ok(result.id, 'Result should have id');
  assert.ok(result.title, 'Result should have title');
  assert.ok(result.url, 'Result should have url');
  assert.ok(result.source, 'Result should have source');
  assert.ok(result.author, 'Result should have author');
});

test('searchLinks convenience function should work', () => {
  const results = searchLinks(testLinks, 'node');
  assert.ok(results.length > 0, 'Should find Node.js link');
  assert.ok(results.some((link) => link.id === '4'), 'Should find correct link');
});

test('search should handle multiple word queries', () => {
  const searcher = createSearcher(testLinks);
  const results = search(searcher, 'typescript documentation');
  assert.ok(results.length > 0, 'Should find links matching multiple words');
});

test('search should work with short queries (minMatchCharLength=1)', () => {
  const searcher = createSearcher(testLinks);
  const results = search(searcher, 'js');
  assert.ok(results.length > 0, 'Should find results for 2-char query');
});

test('FUSE_CONFIG should have expected keys configured', () => {
  assert.deepEqual(FUSE_CONFIG.keys, ['title', 'url'], 'Should search title and url');
  assert.equal(FUSE_CONFIG.threshold, 0.3, 'Should have threshold 0.3');
  assert.equal(FUSE_CONFIG.minMatchCharLength, 1, 'Should allow 1-char matches');
});

test('multiple searchers on same data should be independent', () => {
  const searcher1 = createSearcher(testLinks);
  const searcher2 = createSearcher(testLinks);
  
  const results1 = search(searcher1, 'react');
  const results2 = search(searcher2, 'react');
  
  assert.deepEqual(results1, results2, 'Independent searchers should produce same results');
});

test('searcher should handle empty links array', () => {
  const searcher = createSearcher([]);
  const results = search(searcher, 'test');
  assert.equal(results.length, 0, 'Should return empty for empty links array');
});

test('search should trim whitespace from query', () => {
  const searcher = createSearcher(testLinks);
  const resultsWithWhitespace = search(searcher, '  typescript  ');
  const resultsWithoutWhitespace = search(searcher, 'typescript');
  
  // Both should find the same results
  assert.equal(resultsWithWhitespace.length, resultsWithoutWhitespace.length, 'Whitespace should be trimmed');
});
