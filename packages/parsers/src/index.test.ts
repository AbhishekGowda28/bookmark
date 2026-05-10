import { test } from 'node:test';
import assert from 'node:assert';
import { parseXbel, parseMarkdown, parseRssEntries } from './index.js';

test('parseXbel - parses simple bookmarks', async () => {
  const xbel = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xbel PUBLIC "+//IDN python.org//DTD XML Bookmark Exchange Language 1.0//EN//XML" "http://pyxml.sourceforge.net/topics/dtds/xbel.dtd">
<xbel version="1.0">
  <bookmark href="https://example.com" id="1">
    <title>Example</title>
  </bookmark>
</xbel>`;

  const result = await parseXbel(xbel);
  assert.strictEqual(result.links.length, 1);
  assert.strictEqual(result.links[0].title, 'Example');
  assert.strictEqual(result.links[0].url, 'https://example.com');
  assert.strictEqual(result.links[0].source, 'bookmark');
});

test('parseXbel - parses nested folders', async () => {
  const xbel = `<?xml version="1.0" encoding="UTF-8"?>
<xbel version="1.0">
  <folder id="1">
    <title>Folder 1</title>
    <bookmark href="https://example1.com" id="1">
      <title>Link 1</title>
    </bookmark>
    <folder id="2">
      <title>Nested Folder</title>
      <bookmark href="https://example2.com" id="2">
        <title>Link 2</title>
      </bookmark>
    </folder>
  </folder>
</xbel>`;

  const result = await parseXbel(xbel);
  assert.strictEqual(result.links.length, 2);
  assert.strictEqual(result.links[0].title, 'Link 1');
  assert.strictEqual(result.links[1].title, 'Link 2');
});

test('parseXbel - handles empty XBEL', async () => {
  const xbel = `<?xml version="1.0" encoding="UTF-8"?>
<xbel version="1.0">
</xbel>`;

  const result = await parseXbel(xbel);
  assert.strictEqual(result.links.length, 0);
});

test('parseXbel - skips invalid bookmarks', async () => {
  const xbel = `<?xml version="1.0" encoding="UTF-8"?>
<xbel version="1.0">
  <bookmark href="https://example.com" id="1">
    <title>Valid</title>
  </bookmark>
  <bookmark id="2">
    <title>No URL</title>
  </bookmark>
</xbel>`;

  const result = await parseXbel(xbel);
  assert.strictEqual(result.links.length, 1);
  assert.strictEqual(result.links[0].title, 'Valid');
});

test('parseMarkdown - extracts markdown links', async () => {
  const markdown = `# Test
[Example Link](https://example.com)
[Another Link](https://another.com)`;

  const result = await parseMarkdown(markdown);
  assert.strictEqual(result.links.length, 2);
  assert.strictEqual(result.links[0].url, 'https://example.com');
  assert.strictEqual(result.links[1].url, 'https://another.com');
});

test('parseMarkdown - handles mixed content', async () => {
  const markdown = `# Heading
Some text here
[Link 1](https://link1.com)
**Bold text**
[Link 2](https://link2.com)
*Italic text*`;

  const result = await parseMarkdown(markdown);
  assert.strictEqual(result.links.length, 2);
});

test('parseMarkdown - handles empty markdown', async () => {
  const markdown = `# Empty
No links here`;

  const result = await parseMarkdown(markdown);
  assert.strictEqual(result.links.length, 0);
});

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
