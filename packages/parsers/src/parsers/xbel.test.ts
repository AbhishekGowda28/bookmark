import { test } from 'node:test';
import assert from 'node:assert';
import { parseXbel } from './xbel.js';

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
  assert.strictEqual(result.success, true);
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
      <bookmark href="https://nested.com" id="3">
        <title>Nested Link</title>
      </bookmark>
    </folder>
  </folder>
</xbel>`;

  const result = await parseXbel(xbel);
  assert.strictEqual(result.links.length, 2);
  assert.strictEqual(result.links[0].title, 'Link 1');
  assert.strictEqual(result.links[1].title, 'Nested Link');
});

test('parseXbel - handles empty XBEL', async () => {
  const xbel = `<?xml version="1.0" encoding="UTF-8"?>
<xbel version="1.0">
</xbel>`;

  const result = await parseXbel(xbel);
  assert.strictEqual(result.links.length, 0);
  assert.strictEqual(result.success, true);
});

test('parseXbel - skips invalid bookmarks', async () => {
  const xbel = `<?xml version="1.0" encoding="UTF-8"?>
<xbel version="1.0">
  <bookmark href="https://example.com" id="1">
    <title>Valid</title>
  </bookmark>
  <bookmark href="" id="2">
    <title>No URL</title>
  </bookmark>
</xbel>`;

  const result = await parseXbel(xbel);
  assert.strictEqual(result.links.length, 1);
  assert.strictEqual(result.links[0].title, 'Valid');
  assert.ok(result.errors.length > 0);
});
