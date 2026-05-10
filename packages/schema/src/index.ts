// DEPRECATED: Use @bookmark/validation instead
// This module is maintained for backward compatibility only

export {
  LinkSchema,
  BookmarkLinkSchema,
  RssLinkSchema,
  LinkMetadataSchema,
  FeedSourceSchema,
  FeedSchema,
  ConfigSchema,
  RssEntrySchema,
  validateLink,
  isLink,
  validateBookmarkLink,
  isBookmarkLink,
  validateRssLink,
  isRssLink,
  validateFeed,
  isFeed,
  validateFeedSource,
  isFeedSource,
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
} from '@bookmark/validation';

export type { Link, Feed, FeedSource, RssEntry, Config } from '@bookmark/validation';

export default {
  LinkSchema: 'See @bookmark/validation',
  validateLink: 'See @bookmark/validation',
  isLink: 'See @bookmark/validation',
};
