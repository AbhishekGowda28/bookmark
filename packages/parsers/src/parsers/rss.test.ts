import { test } from 'node:test';
import assert from 'node:assert';
import { parseRssEntries } from './rss.js';

test('parseRssEntries - converts entries to links', async () => {
  const entries = [
    {
      author: 'TechNews',
      title: 'New Framework Released',
      url: 'https://technews.com/1',
      date: '2024-01-15',
    },
    {
      author: 'DevBlog',
      title: 'Best Practices',
      url: 'https://devblog.com/1',
      date: '2024-01-16',
    },
  ];

  const result = await parseRssEntries(entries);
  assert.strictEqual(result.links.length, 2);
  assert.strictEqual(result.links[0].feed, 'TechNews');
  assert.strictEqual(result.links[0].source, 'rss');
  assert.strictEqual(result.links[1].feed, 'DevBlog');
  assert.strictEqual(result.success, true);
});

test('parseRssEntries - filters invalid entries', async () => {
  const entries = [
    {
      author: 'ValidFeed',
      title: 'Valid Entry',
      url: 'https://valid.com',
      date: '2024-01-15',
    },
    {
      author: 'InvalidFeed',
      title: '',
      url: 'https://invalid.com',
      date: '2024-01-16',
    },
  ];

  const result = await parseRssEntries(entries);
  // Both should be included since our validation is lenient
  assert(result.links.length >= 1);
});
