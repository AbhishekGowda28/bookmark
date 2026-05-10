import { test } from 'node:test';
import assert from 'node:assert';
import {
  LinkSchema,
  FeedSchema,
  ConfigSchema,
  RssEntrySchema,
  FeedSourceSchema,
  validateLink,
  isLink,
  validateFeed,
  isFeed,
  validateConfig,
  isConfig,
  validateRssEntry,
  isRssEntry,
  validateLinks,
  safeParseLinkOrNull,
  getLinkValidationErrors,
  normalizeUrl,
  isDuplicate,
  formatUrl,
  formatDate,
  generateId,
  ensureLink,
} from './index.js';

// Valid test data
const validLink = {
  id: '1',
  title: 'Test Link',
  url: 'https://example.com',
  source: 'bookmark' as const,
};

const validFeedSource = {
  url: 'https://example.com/feed',
  schedule: 'daily' as const,
  maxEntries: 10,
};

const validFeed = {
  id: 'feed-1',
  author: 'John Doe',
  authorMaxEntries: 50,
  sources: [validFeedSource],
};

const validConfig = {
  feeds: [validFeed],
};

const validRssEntry = {
  author: 'John Doe',
  title: 'Article Title',
  url: 'https://example.com/article',
  date: new Date().toISOString(),
};

// ============= LinkSchema Tests =============

test('LinkSchema: accepts valid bookmark link', () => {
  const result = LinkSchema.safeParse(validLink);
  assert.ok(result.success, 'Valid bookmark link should pass');
});

test('LinkSchema: accepts RSS link with feed', () => {
  const rssLink = { ...validLink, source: 'rss', feed: 'blog' };
  const result = LinkSchema.safeParse(rssLink);
  assert.ok(result.success, 'Valid RSS link should pass');
});

test('LinkSchema: rejects missing id', () => {
  const invalid = { ...validLink, id: undefined };
  const result = LinkSchema.safeParse(invalid);
  assert.ok(!result.success, 'Link without id should fail');
});

test('LinkSchema: rejects empty title', () => {
  const invalid = { ...validLink, title: '' };
  const result = LinkSchema.safeParse(invalid);
  assert.ok(!result.success, 'Link with empty title should fail');
});

test('LinkSchema: rejects invalid URL', () => {
  const invalid = { ...validLink, url: 'not-a-url' };
  const result = LinkSchema.safeParse(invalid);
  assert.ok(!result.success, 'Link with invalid URL should fail');
});

test('LinkSchema: rejects invalid source', () => {
  const invalid = { ...validLink, source: 'invalid' };
  const result = LinkSchema.safeParse(invalid);
  assert.ok(!result.success, 'Link with invalid source should fail');
});

test('LinkSchema: accepts optional fields', () => {
  const withOptionals = {
    ...validLink,
    author: 'Jane Doe',
    tags: ['tech', 'learning'],
    addedAt: new Date().toISOString(),
  };
  const result = LinkSchema.safeParse(withOptionals);
  assert.ok(result.success, 'Link with optional fields should pass');
});

// ============= FeedSourceSchema Tests =============

test('FeedSourceSchema: accepts valid feed source', () => {
  const result = FeedSourceSchema.safeParse(validFeedSource);
  assert.ok(result.success, 'Valid feed source should pass');
});

test('FeedSourceSchema: rejects invalid schedule', () => {
  const invalid = { ...validFeedSource, schedule: 'biweekly' };
  const result = FeedSourceSchema.safeParse(invalid);
  assert.ok(!result.success, 'Invalid schedule should fail');
});

test('FeedSourceSchema: rejects non-positive maxEntries', () => {
  const invalid = { ...validFeedSource, maxEntries: 0 };
  const result = FeedSourceSchema.safeParse(invalid);
  assert.ok(!result.success, 'Non-positive maxEntries should fail');
});

test('FeedSourceSchema: rejects non-integer maxEntries', () => {
  const invalid = { ...validFeedSource, maxEntries: 5.5 };
  const result = FeedSourceSchema.safeParse(invalid);
  assert.ok(!result.success, 'Non-integer maxEntries should fail');
});

// ============= FeedSchema Tests =============

test('FeedSchema: accepts valid feed', () => {
  const result = FeedSchema.safeParse(validFeed);
  assert.ok(result.success, 'Valid feed should pass');
});

test('FeedSchema: rejects empty sources array', () => {
  const invalid = { ...validFeed, sources: [] };
  const result = FeedSchema.safeParse(invalid);
  assert.ok(!result.success, 'Feed with empty sources should fail');
});

test('FeedSchema: rejects non-positive authorMaxEntries', () => {
  const invalid = { ...validFeed, authorMaxEntries: -5 };
  const result = FeedSchema.safeParse(invalid);
  assert.ok(!result.success, 'Non-positive authorMaxEntries should fail');
});

// ============= ConfigSchema Tests =============

test('ConfigSchema: accepts valid config', () => {
  const result = ConfigSchema.safeParse(validConfig);
  assert.ok(result.success, 'Valid config should pass');
});

test('ConfigSchema: rejects empty feeds array', () => {
  const invalid = { feeds: [] };
  const result = ConfigSchema.safeParse(invalid);
  assert.ok(!result.success, 'Config with empty feeds should fail');
});

// ============= RssEntrySchema Tests =============

test('RssEntrySchema: accepts valid RSS entry', () => {
  const result = RssEntrySchema.safeParse(validRssEntry);
  assert.ok(result.success, 'Valid RSS entry should pass');
});

test('RssEntrySchema: rejects invalid date format', () => {
  const invalid = { ...validRssEntry, date: 'not-a-date' };
  const result = RssEntrySchema.safeParse(invalid);
  assert.ok(!result.success, 'RSS entry with invalid date should fail');
});

// ============= Validation Functions Tests =============

test('validateLink: returns validated Link', () => {
  const link = validateLink(validLink);
  assert.equal(link.id, validLink.id, 'Should return validated link');
});

test('validateLink: throws on invalid data', () => {
  assert.throws(
    () => validateLink({ ...validLink, url: 'invalid' }),
    'Should throw on invalid URL'
  );
});

test('isLink: type guard returns true for valid', () => {
  assert.ok(isLink(validLink), 'isLink should return true for valid link');
});

test('isLink: type guard returns false for invalid', () => {
  assert.ok(!isLink({ ...validLink, url: 'invalid' }), 'isLink should return false for invalid');
});

test('validateFeed: returns validated Feed', () => {
  const feed = validateFeed(validFeed);
  assert.equal(feed.id, validFeed.id, 'Should return validated feed');
});

test('isFeed: type guard works correctly', () => {
  assert.ok(isFeed(validFeed), 'isFeed should return true for valid');
  assert.ok(!isFeed({ ...validFeed, sources: [] }), 'isFeed should return false for invalid');
});

test('validateConfig: returns validated Config', () => {
  const config = validateConfig(validConfig);
  assert.equal(config.feeds.length, 1, 'Should return validated config');
});

test('isConfig: type guard works correctly', () => {
  assert.ok(isConfig(validConfig), 'isConfig should return true for valid');
  assert.ok(!isConfig({ feeds: [] }), 'isConfig should return false for invalid');
});

test('validateRssEntry: returns validated RssEntry', () => {
  const entry = validateRssEntry(validRssEntry);
  assert.equal(entry.author, validRssEntry.author, 'Should return validated entry');
});

test('isRssEntry: type guard works correctly', () => {
  assert.ok(isRssEntry(validRssEntry), 'isRssEntry should return true for valid');
  assert.ok(
    !isRssEntry({ ...validRssEntry, date: 'invalid' }),
    'isRssEntry should return false for invalid'
  );
});

test('validateLinks: validates array of links', () => {
  const links = validateLinks([validLink, { ...validLink, id: '2' }]);
  assert.equal(links.length, 2, 'Should validate array of links');
});

test('validateLinks: throws if any link invalid', () => {
  assert.throws(
    () => validateLinks([validLink, { ...validLink, url: 'invalid' }]),
    'Should throw if any link invalid'
  );
});

test('safeParseLinkOrNull: returns link on success', () => {
  const link = safeParseLinkOrNull(validLink);
  assert.ok(link !== null, 'Should return link');
  assert.equal(link?.id, validLink.id, 'Should return correct link');
});

test('safeParseLinkOrNull: returns null on failure', () => {
  const link = safeParseLinkOrNull({ ...validLink, url: 'invalid' });
  assert.equal(link, null, 'Should return null for invalid link');
});

test('getLinkValidationErrors: returns empty for valid', () => {
  const errors = getLinkValidationErrors(validLink);
  assert.equal(errors.length, 0, 'Should return no errors for valid link');
});

test('LinkSchema: error handling for completely invalid data', () => {
  const result = LinkSchema.safeParse({ not: 'a link' });
  assert.ok(!result.success, 'Should fail validation');
  if (!result.success) {
    assert.ok((result.error?.issues?.length || 0) > 0, 'Should have issues');
  }
});

test('LinkSchema: accepts complex URLs', () => {
  const complex = {
    ...validLink,
    url: 'https://example.com:8080/path/to/page?query=value&foo=bar#anchor',
  };
  const result = LinkSchema.safeParse(complex);
  assert.ok(result.success, 'Should accept complex URLs');
});

test('FeedSchema: accepts multiple sources', () => {
  const multi = {
    ...validFeed,
    sources: [validFeedSource, { ...validFeedSource, url: 'https://other.com/feed' }],
  };
  const result = FeedSchema.safeParse(multi);
  assert.ok(result.success, 'Should accept multiple sources');
});

test('ConfigSchema: validates cascading constraints', () => {
  const config = {
    feeds: [
      validFeed,
      {
        ...validFeed,
        id: 'feed-2',
        author: 'Jane Doe',
        sources: [{ ...validFeedSource, url: 'https://jane.com/feed' }],
      },
    ],
  };
  const result = ConfigSchema.safeParse(config);
  assert.ok(result.success, 'Should validate complex config with multiple feeds');
});

test('LinkSchema: rejects null source', () => {
  const invalid = { ...validLink, source: null };
  const result = LinkSchema.safeParse(invalid);
  assert.ok(!result.success, 'Should reject null source');
});

test('LinkSchema: rejects non-string id', () => {
  const invalid = { ...validLink, id: 123 };
  const result = LinkSchema.safeParse(invalid);
  assert.ok(!result.success, 'Should reject non-string id');
});

// ============= URL Utilities Tests =============

test('normalizeUrl: removes trailing slash', () => {
  const url1 = 'https://example.com/path/';
  const url2 = 'https://example.com/path';
  assert.equal(normalizeUrl(url1), normalizeUrl(url2), 'Should normalize trailing slash');
});

test('normalizeUrl: handles case insensitivity', () => {
  const url1 = 'https://Example.COM/Path';
  const url2 = 'https://example.com/path';
  assert.equal(normalizeUrl(url1), normalizeUrl(url2), 'Should be case-insensitive');
});

test('isDuplicate: detects same URLs', () => {
  const link1 = { ...validLink, id: '1', url: 'https://example.com/article' };
  const link2 = { ...validLink, id: '2', url: 'https://example.com/article' };
  assert.ok(isDuplicate(link1, link2), 'Should detect duplicates');
});

test('isDuplicate: normalizes before comparing', () => {
  const link1 = { ...validLink, id: '1', url: 'https://example.com/article/' };
  const link2 = { ...validLink, id: '2', url: 'https://example.com/article' };
  assert.ok(isDuplicate(link1, link2), 'Should normalize URLs before comparing');
});

test('formatUrl: returns hostname', () => {
  const url = 'https://example.com/path/to/page';
  const result = formatUrl(url);
  assert.equal(result, 'example.com/path/to/page', 'Should return hostname with path');
});

test('formatUrl: handles root path', () => {
  const url = 'https://example.com/';
  const result = formatUrl(url);
  assert.equal(result, 'example.com', 'Should omit root path');
});

test('formatDate: formats ISO string', () => {
  const isoDate = '2026-05-10T10:00:00Z';
  const result = formatDate(isoDate);
  assert.ok(result.includes('May'), 'Should include month name');
  assert.ok(result.includes('2026'), 'Should include year');
});

test('formatDate: handles Date object', () => {
  const date = new Date('2026-05-10T10:00:00Z');
  const result = formatDate(date);
  assert.ok(result.includes('May'), 'Should format Date object');
});

// ============= ID Generation Tests =============

test('generateId: creates non-empty string', () => {
  const id = generateId();
  assert.ok(id.length > 0, 'Should generate non-empty ID');
  assert.equal(typeof id, 'string', 'Should return string');
});

test('generateId: creates unique IDs', () => {
  const id1 = generateId();
  const id2 = generateId();
  assert.notEqual(id1, id2, 'Should generate unique IDs');
});

test('ensureLink: returns link with ID', () => {
  const partial = { title: 'Test', url: 'https://example.com' };
  const link = ensureLink(partial as any);
  assert.ok(link.id, 'Should have ID');
  assert.equal(link.title, partial.title, 'Should preserve title');
});

test('ensureLink: generates ID if missing', () => {
  const partial = { title: 'Test', url: 'https://example.com' };
  const link = ensureLink(partial as any);
  assert.ok(link.id.length > 0, 'Should generate ID');
});

test('ensureLink: defaults title to Untitled', () => {
  const partial = { url: 'https://example.com' };
  const link = ensureLink(partial as any);
  assert.equal(link.title, 'Untitled', 'Should default to Untitled');
});

test('ensureLink: sets default source to bookmark', () => {
  const partial = { id: '1', title: 'Test', url: 'https://example.com' };
  const link = ensureLink(partial as any);
  assert.equal(link.source, 'bookmark', 'Should default source to bookmark');
});
