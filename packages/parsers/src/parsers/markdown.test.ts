import { test } from 'node:test';
import assert from 'node:assert';
import { parseMarkdown } from './markdown.js';

test('parseMarkdown - extracts markdown links', async () => {
  const markdown = `# Test
[Example Link](https://example.com)
[Another Link](https://another.com)`;

  const links = await parseMarkdown(markdown);
  assert.strictEqual(links.length, 2);
  assert.strictEqual(links[0].url, 'https://example.com');
  assert.strictEqual(links[1].url, 'https://another.com');
});

test('parseMarkdown - handles mixed content', async () => {
  const markdown = `# Heading
Some text here
[Link 1](https://link1.com)
**Bold text**
[Link 2](https://link2.com)
*Italic text*`;

  const links = await parseMarkdown(markdown);
  assert.strictEqual(links.length, 2);
});

test('parseMarkdown - handles empty markdown', async () => {
  const markdown = `# Empty
No links here`;

  const links = await parseMarkdown(markdown);
  assert.strictEqual(links.length, 0);
});
