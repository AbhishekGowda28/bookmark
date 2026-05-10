# Domain Context

This document defines the core domain language for the bookmark and RSS aggregator monorepo.

## Core Entities

### Link
The primary domain entity representing a saved reference to a web resource.

- **Bookmark Link**: A link saved directly by the user (from browser bookmarks in `bookmarks.xbel` or browser tabs in `tabs.xbel`)
- **RSS Link**: A link discovered through RSS feed entries and converted to Link format

**Fields:**
- `id`: Unique identifier (UUID)
- `url`: Web resource URL
- `title`: Display title
- `source`: Discriminator indicating origin ('bookmark' or 'rss')
- `feed`: Feed name (only valid for RSS links)
- `addedAt`: ISO8601 timestamp
- `metadata`: Extensible metadata object for Phase 2 features (notes, tags, etc.)

**Invariants:**
- `feed` field valid only when `source === 'rss'`
- `url` must be valid HTTP(S) URL
- `title` must be non-empty string

### Source
Discriminator indicating where a Link originated.

- **'bookmark'**: Link from browser bookmarks or tabs (XBEL files)
- **'rss'**: Link from RSS feed entry

### Feed
Configuration describing an RSS feed source with entry limits.

**Fields:**
- `name`: Display name of the feed
- `sources`: Array of FeedSource configurations
- `authorMaxEntries`: Maximum entries per author across all sources

**Purpose:**
- Per-feed and per-author entry limits prevent RSS sources from overwhelming the aggregation
- Enables control over which RSS entries are included in final Link set

### Format
Three supported parseable formats for importing links.

- **XBEL**: XML Bookmark Exchange Language (browser bookmarks/tabs)
- **Markdown**: Markdown link syntax `[title](url)`
- **RSS**: RSS/Atom feed entries (fetched via GitHub Actions)

**Parser Contract:**
All formats produce Link arrays through a unified Parser interface (see PHASE B.1).

### Aggregation
The process of merging and deduplicating links from multiple sources.

**Process:**
1. **Parse**: Convert XBEL, Markdown, and RSS sources to Link arrays
2. **Merge**: Combine all Link arrays
3. **Deduplicate**: Remove duplicate links (same URL, case-insensitive, normalized)
4. **Filter**: Apply per-feed and per-author limits
5. **Output**: Final deduplicated Link array

**Invariants:**
- Deduplication keeps first occurrence
- Final set size = 677 links (as of latest aggregation)

### Searcher
Encapsulated search engine over a Link set.

**Purpose:**
- Enable full-text search across link titles and URLs
- Abstract away Fuse.js implementation details
- Support algorithm swaps without breaking consumers

**Interface:**
- Created once per link set via `createSearcher(links)`
- Stateful: maintains internal Fuse.js instance
- Queryable: `search(query, options)` returns matching links
- Type-safe: returns Link[] with no Fuse.js types leaked

### Validation Contract
Two-layer approach to data validation (being consolidated in PHASE A.1).

**Current approach (to be unified):**
- **Schema validation**: Zod schemas in @bookmark/schema (structured validation with error messages)
- **Utility validation**: Type guards and utilities in @bookmark/utils (runtime type checking)

**Future approach:**
- Single @bookmark/validation package as source of truth
- All types validated through unified interface
- Clear convention: where types get validated and by whom

## Architectural Principles

### Locality
Changes and bugs stay localized to one module when possible. Related concepts live together.

### Leverage
Interfaces hide implementation complexity, enabling future changes without breaking consumers.

### Seam
A place where behavior can be changed without editing code in place. Adapters satisfy interfaces at seams.

**Current seams:**
- Searcher (Fuse.js ↔ consumer via interface)
- Schema validation (Zod ↔ CLI via validateConfig)
- Parser formats (three formats ↔ CLI via individual functions, consolidating to interface in PHASE B.1)

## Phase Milestones

### Phase 1: Searchable Link Aggregator ✅
- 677 deduplicated links from 923 bookmarks + 15 tabs
- React UI with full-text search
- Deployed to GitHub Pages

### Phase 2 (Roadmap)
- Multi-user support
- Mobile app
- Advanced search filters
- Link metadata (notes, tags, read status)
- Sharing and collaboration

---

**Last updated:** 2026-05-10  
**Updated by:** Architectural deepening review
