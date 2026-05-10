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

  const links = await parseXbel(xbel);
  assert.strictEqual(links.length, 1);
  assert.strictEqual(links[0].title, 'Example');
  assert.strictEqual(links[0].url, 'https://example.com');
  assert.strictEqual(links[0].source, 'bookmark');
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

  const links = await parseXbel(xbel);
  assert.strictEqual(links.length, 2);
  assert.strictEqual(links[0].title, 'Link 1');
  assert.strictEqual(links[1].title, 'Nested Link');
});

test('parseXbel - handles empty XBEL', async () => {
  const xbel = `<?xml version="1.0" encoding="UTF-8"?>
<xbel version="1.0">
</xbel>`;

  const links = await parseXbel(xbel);
  assert.strictEqual(links.length, 0);
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

  const links = await parseXbel(xbel);
  assert.strictEqual(links.length, 1);
  assert.strictEqual(links[0].title, 'Valid');
});
