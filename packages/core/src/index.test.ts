import { test } from 'node:test';
import assert from 'node:assert';
import { merge, deduplicate, combine, groupBySource, filterByFeed } from './index.js';
import type { Link } from '@bookmark/types';

test('merge - combines multiple arrays', () => {
  const source1: Link[] = [
    { id: '1', title: 'Link 1', url: 'https://example1.com', source: 'bookmark' },
  ];
  const source2: Link[] = [
    { id: '2', title: 'Link 2', url: 'https://example2.com', source: 'bookmark' },
  ];

  const result = merge([source1, source2]);
  assert.strictEqual(result.length, 2);
  assert.strictEqual(result[0].url, 'https://example1.com');
  assert.strictEqual(result[1].url, 'https://example2.com');
});

test('merge - handles empty arrays', () => {
  const result = merge([[], []]);
  assert.strictEqual(result.length, 0);
});

test('merge - preserves order', () => {
  const source1: Link[] = [
    { id: '1', title: 'A', url: 'https://a.com', source: 'bookmark' },
    { id: '2', title: 'B', url: 'https://b.com', source: 'bookmark' },
  ];
  const source2: Link[] = [{ id: '3', title: 'C', url: 'https://c.com', source: 'bookmark' }];

  const result = merge([source1, source2]);
  assert.deepStrictEqual(
    result.map((l) => l.title),
    ['A', 'B', 'C']
  );
});

test('deduplicate - removes exact duplicates', () => {
  const links: Link[] = [
    { id: '1', title: 'Link 1', url: 'https://example.com', source: 'bookmark' },
    { id: '2', title: 'Link 2', url: 'https://example.com', source: 'bookmark' },
  ];

  const result = deduplicate(links);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].title, 'Link 1');
});

test('deduplicate - handles normalized URLs', () => {
  const links: Link[] = [
    { id: '1', title: 'Link 1', url: 'https://example.com/', source: 'bookmark' },
    { id: '2', title: 'Link 2', url: 'https://example.com', source: 'bookmark' },
  ];

  const result = deduplicate(links);
  assert.strictEqual(result.length, 1);
});

test('deduplicate - case-insensitive comparison', () => {
  const links: Link[] = [
    { id: '1', title: 'Link 1', url: 'https://EXAMPLE.COM', source: 'bookmark' },
    { id: '2', title: 'Link 2', url: 'https://example.com', source: 'bookmark' },
  ];

  const result = deduplicate(links);
  assert.strictEqual(result.length, 1);
});

test('deduplicate - keeps first occurrence', () => {
  const links: Link[] = [
    { id: '1', title: 'First Title', url: 'https://example.com', source: 'bookmark' },
    { id: '2', title: 'Second Title', url: 'https://example.com', source: 'bookmark' },
  ];

  const result = deduplicate(links);
  assert.strictEqual(result[0].title, 'First Title');
});

test('combine - merges and deduplicates', () => {
  const source1: Link[] = [
    { id: '1', title: 'Link 1', url: 'https://example1.com', source: 'bookmark' },
    { id: '2', title: 'Link 2', url: 'https://example2.com', source: 'bookmark' },
  ];
  const source2: Link[] = [
    { id: '3', title: 'Link 1 Dup', url: 'https://example1.com', source: 'bookmark' },
    { id: '4', title: 'Link 3', url: 'https://example3.com', source: 'bookmark' },
  ];

  const result = combine([source1, source2]);
  assert.strictEqual(result.length, 3);
  assert.strictEqual(result[0].title, 'Link 1');
  assert.strictEqual(result[1].title, 'Link 2');
  assert.strictEqual(result[2].title, 'Link 3');
});

test('groupBySource - separates bookmarks and RSS', () => {
  const links: Link[] = [
    { id: '1', title: 'Bookmark 1', url: 'https://example1.com', source: 'bookmark' },
    { id: '2', title: 'RSS 1', url: 'https://rss1.com', source: 'rss', feed: 'TechNews' },
    { id: '3', title: 'Bookmark 2', url: 'https://example2.com', source: 'bookmark' },
    { id: '4', title: 'RSS 2', url: 'https://rss2.com', source: 'rss', feed: 'DevBlog' },
  ];

  const result = groupBySource(links);
  assert.strictEqual(result.bookmark.length, 2);
  assert.strictEqual(result.rss.length, 2);
  assert.strictEqual(result.bookmark[0].title, 'Bookmark 1');
  assert.strictEqual(result.rss[0].title, 'RSS 1');
});

test('filterByFeed - returns links from specific feed', () => {
  const links: Link[] = [
    { id: '1', title: 'Article 1', url: 'https://tech1.com', source: 'rss', feed: 'TechNews' },
    { id: '2', title: 'Article 2', url: 'https://dev1.com', source: 'rss', feed: 'DevBlog' },
    { id: '3', title: 'Article 3', url: 'https://tech2.com', source: 'rss', feed: 'TechNews' },
  ];

  const result = filterByFeed(links, 'TechNews');
  assert.strictEqual(result.length, 2);
  assert.strictEqual(result[0].feed, 'TechNews');
  assert.strictEqual(result[1].feed, 'TechNews');
});

test('filterByFeed - returns empty for non-existent feed', () => {
  const links: Link[] = [
    { id: '1', title: 'Article 1', url: 'https://tech1.com', source: 'rss', feed: 'TechNews' },
  ];

  const result = filterByFeed(links, 'NonExistent');
  assert.strictEqual(result.length, 0);
});
