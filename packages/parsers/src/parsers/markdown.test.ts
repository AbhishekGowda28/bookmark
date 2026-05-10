import { test } from 'node:test';
import assert from 'node:assert';
import { parseMarkdown } from './markdown.js';

test('parseMarkdown - extracts markdown links', async () => {
  const markdown = `# Test
[Example Link](https://example.com)
[Another Link](https://another.com)`;

  const result = await parseMarkdown(markdown);
  assert.strictEqual(result.links.length, 2);
  assert.strictEqual(result.links[0].url, 'https://example.com');
  assert.strictEqual(result.links[1].url, 'https://another.com');
  assert.strictEqual(result.success, true);
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
  assert.strictEqual(result.success, true);
});
