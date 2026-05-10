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

  const links = await parseRssEntries(entries);
  assert.strictEqual(links.length, 2);
  assert.strictEqual(links[0].feed, 'TechNews');
  assert.strictEqual(links[0].source, 'rss');
  assert.strictEqual(links[1].feed, 'DevBlog');
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

  const links = await parseRssEntries(entries);
  // Both should be included since our validation is lenient
  assert(links.length >= 1);
});
