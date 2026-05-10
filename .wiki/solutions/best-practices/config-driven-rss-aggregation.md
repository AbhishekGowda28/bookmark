# Config-Driven RSS Aggregation Architecture

**Phase:** 2 (RSS Aggregation with Dynamic Config)  
**Status:** Complete & Merged (PR #20)  
**Date:** May 10, 2026  
**Tests:** 189/189 passing

## Problem Statement

**Before Phase 2**: RSS feed sources were hardcoded in the aggregation logic. Adding, modifying, or removing feeds required code changes and redeployment. Different feeds needed different retry strategies, entry limits, and schedules, but these were not configurable.

**After Phase 2**: The system reads all feed configuration from `feeds.json`, enabling:
- Dynamic feed management without code changes
- Per-feed refresh schedules (weekly/monthly via GitHub Actions matrix)
- Per-feed entry limits (`maxEntries`) and per-author limits (`authorMaxEntries`)
- Non-fatal error handling (one feed failure doesn't block aggregation)
- Clear visibility into per-feed successes and failures

This document captures the architectural patterns and implementation decisions that enable this flexibility while maintaining type safety and error resilience.

---

## Architecture Overview

### Three-Layer Link Aggregation System

The system aggregates links from three independent sources:

1. **Bookmarks** (`bookmarks.xbel`): User-maintained browser bookmarks
2. **Browser Tabs** (`tabs.xbel`): Currently open browser tabs
3. **RSS Feeds** (`feeds.json` → configured feeds): Programmatically fetched entries

See [PHASE-1-DESIGN.md](../../PHASE-1-DESIGN.md) for foundational three-source architecture.

### Pipeline Architecture

The aggregation runs as a **type-safe pipeline** where each step transforms `AggregationData`:

```
Initialize
    ↓
LoadConfig (feeds.json)
    ↓
ValidateConfig ← (NEW Phase 2)
    ↓
LoadBookmarks (bookmarks.xbel)
    ↓
LoadTabs (tabs.xbel)
    ↓
LoadRss ← (NEW Phase 2: fetch from feeds.json)
    ↓
MergeLinks (combine from all sources)
    ↓
GenerateReadme ← (ENHANCED Phase 2: include RSS links)
    ↓
AggregationReport ← (NEW Phase 2: per-feed stats)
```

All steps implement the `Step<T, T>` contract, preserving the `AggregationData` type through the pipeline. See [STEP-DEVELOPMENT-GUIDE.md](../../STEP-DEVELOPMENT-GUIDE.md#step-contract) for Step development patterns.

### Parser Registry Pattern

RSS parsing is implemented as a registry of pluggable parsers, enabling extensibility without modifying aggregation logic:

```typescript
// From packages/parsers/src/parsers/rss.ts
export async function parseRssEntries(
  feed: Feed,
  source: FeedSource,
  entries: any[]
): Promise<ParseResult> {
  // Returns { links, errors }
  // Non-fatal: errors collected per feed, doesn't block aggregation
}
```

The parser registry pattern was established in [ARCHITECTURAL-DEEPENING-OPPORTUNITIES.md Phase A.2](../../ARCHITECTURAL-DEEPENING-OPPORTUNITIES.md#phase-a2-parser-registry-pattern). Phase 2 builds on this foundation by:
- Adding `parseRssEntries()` as the entries parser
- Collecting errors per feed without failing the entire aggregation
- Using `ParseResult` type for consistent error handling

---

## Core Components

### 1. Configuration System (`feeds.json`)

The `feeds.json` file is the **single source of truth** for RSS feed configuration:

```json
{
  "feeds": [
    {
      "id": "weekly-digest",
      "author": "John Doe",
      "authorMaxEntries": 5,
      "sources": [
        {
          "url": "https://example.com/feed.xml",
          "schedule": "weekly",
          "maxEntries": 10
        }
      ]
    }
  ]
}
```

**Key Design Decisions:**
- **Single configuration source**: No separate YAML, all in `feeds.json`
- **Per-feed scheduling**: Each source has its own `schedule` (weekly/monthly)
- **Per-feed limits**: `maxEntries` controls total entries per source
- **Per-author limits**: `authorMaxEntries` controls entries per author
- **Extensibility**: New feed sources added without code changes

**Validation**: The `ValidateConfigStep` enforces schema rules before RSS fetching begins, preventing downstream errors. See [Phase C.2 Validation Seam](../../ARCHITECTURAL-DEEPENING-OPPORTUNITIES.md#phase-c2-validation-seam).

### 2. FetchRssStep: Core Fetching Logic

Located at: `packages/cli/src/steps/FetchRssStep.ts`

```typescript
export class FetchRssStep implements Step<AggregationData, AggregationData> {
  async run(data: AggregationData): Promise<AggregationData> {
    const feeds = data.config?.feeds || [];
    
    for (const feed of feeds) {
      for (const source of feed.sources) {
        try {
          const response = await fetch(source.url, { timeout: 10000 });
          const xml = await response.text();
          const entries = parseXml(xml);
          
          // Use parser registry
          const result = await parseRssEntries(feed, source, entries);
          
          // Collect results (links) and errors per feed
          data.links?.push(...result.links);
          data.errors?.push(...result.errors);
        } catch (error) {
          // Non-fatal: one feed failure doesn't block aggregation
          data.errors?.push({
            feedId: feed.id,
            sourceUrl: source.url,
            message: error.message
          });
        }
      }
    }
    
    return data;
  }
}
```

**Key Patterns:**
- **Per-feed error collection**: Each feed's errors stored independently
- **Non-fatal errors**: Exceptions caught and logged; aggregation continues
- **Parser registry usage**: `parseRssEntries()` handles feed-specific parsing logic
- **Respects limits**: Uses `source.maxEntries` and `feed.authorMaxEntries` from config

### 3. ValidateConfigStep: Early Error Detection

Located at: `packages/cli/src/steps/ValidateConfigStep.ts`

Runs **before** `FetchRssStep` to catch configuration errors early:

```typescript
export class ValidateConfigStep implements Step<AggregationData, AggregationData> {
  async run(data: AggregationData): Promise<AggregationData> {
    const config = data.config;
    
    // Validate feeds.json schema
    if (!config.feeds || !Array.isArray(config.feeds)) {
      throw new Error("Invalid feeds.json: missing 'feeds' array");
    }
    
    for (const feed of config.feeds) {
      if (!feed.id || !feed.author) {
        throw new Error(`Invalid feed: missing required fields`);
      }
      
      for (const source of feed.sources || []) {
        if (!source.url || !source.schedule) {
          throw new Error(`Invalid source in feed ${feed.id}`);
        }
        
        // Validate schedule is weekly or monthly
        if (!['weekly', 'monthly'].includes(source.schedule)) {
          throw new Error(`Invalid schedule: ${source.schedule}`);
        }
      }
    }
    
    return data;
  }
}
```

**Benefits:**
- Fails fast before expensive I/O (network fetches)
- Clear error messages guide configuration fixes
- Prevents invalid state from propagating downstream
- Establishes contract between config and pipeline

### 4. GenerateReadmeStep: Dynamic README Generation

Located at: `packages/cli/src/steps/GenerateReadmeStep.ts`

Updates the main `README.md` with aggregated RSS links:

```typescript
export class GenerateReadmeStep implements Step<AggregationData, AggregationData> {
  async run(data: AggregationData): Promise<AggregationData> {
    let readme = await fs.readFile('README.md', 'utf-8');
    
    // Build RSS section from data.links (from LoadRss)
    const rssSection = this.buildRssSection(data.links || []);
    
    // Replace section between HTML comment delimiters
    const marker = '<!-- RSS_START -->';
    const endMarker = '<!-- RSS_END -->';
    const startIdx = readme.indexOf(marker);
    const endIdx = readme.indexOf(endMarker);
    
    if (startIdx !== -1 && endIdx !== -1) {
      readme = 
        readme.substring(0, startIdx + marker.length) +
        '\n' + rssSection + '\n' +
        readme.substring(endIdx);
      
      await fs.writeFile('README.md', readme);
    }
    
    return data;
  }
  
  private buildRssSection(links: Link[]): string {
    // Group links by feed, format as markdown list
    const grouped = this.groupByFeed(links);
    return Object.entries(grouped)
      .map(([feed, items]) => `### ${feed}\n${items.map(l => `- [${l.title}](${l.url})`).join('\n')}`)
      .join('\n\n');
  }
}
```

**Key Features:**
- HTML comment delimiters (`<!-- RSS_START -->` / `<!-- RSS_END -->`) protect user content
- Generates markdown-formatted RSS links
- Groups links by feed for readability
- Preserves manual edits outside markers

### 5. AggregationReportStep: Per-Feed Statistics

Located at: `packages/cli/src/steps/AggregationReportStep.ts`

Generates aggregation summary with per-feed stats:

```typescript
export class AggregationReportStep implements Step<AggregationData, AggregationData> {
  async run(data: AggregationData): Promise<AggregationData> {
    const report = {
      timestamp: new Date().toISOString(),
      sources: {
        bookmarks: data.bookmarks?.length || 0,
        tabs: data.tabs?.length || 0,
        rss: data.links?.length || 0
      },
      feedStats: this.buildFeedStats(data),
      errors: this.groupErrorsByFeed(data.errors || [])
    };
    
    console.log(JSON.stringify(report, null, 2));
    
    // Optionally save to aggregation-report.json
    if (process.env.SAVE_REPORT) {
      await fs.writeFile('aggregation-report.json', JSON.stringify(report, null, 2));
    }
    
    return data;
  }
  
  private buildFeedStats(data: AggregationData): Record<string, any> {
    // Count successful entries per feed
    return data.config?.feeds?.reduce((acc, feed) => {
      const feedLinks = data.links?.filter(l => l.feedId === feed.id) || [];
      acc[feed.id] = {
        entriesCount: feedLinks.length,
        errorCount: data.errors?.filter(e => e.feedId === feed.id).length || 0
      };
      return acc;
    }, {}) || {};
  }
}
```

**Output Example:**
```json
{
  "timestamp": "2026-05-10T22:30:00Z",
  "sources": {
    "bookmarks": 150,
    "tabs": 8,
    "rss": 45
  },
  "feedStats": {
    "weekly-digest": { "entriesCount": 25, "errorCount": 0 },
    "tech-news": { "entriesCount": 20, "errorCount": 1 }
  },
  "errors": {
    "tech-news": ["Timeout fetching https://news.example.com/feed.xml"]
  }
}
```

---

## Error Handling Strategy

### Non-Fatal Per-Feed Errors

The system uses `ParseResult` type for consistent error handling:

```typescript
type ParseResult = {
  links: Link[];
  errors: ErrorEntry[];
};

type ErrorEntry = {
  feedId: string;
  sourceUrl: string;
  message: string;
};
```

**Error Collection Pattern:**
- Errors collected in `data.errors: ErrorEntry[]`
- One feed failure doesn't block aggregation
- All errors visible in CLI output and workflow logs
- Each error includes feedId + sourceUrl for debugging

**Non-Blocking Scenarios:**
- Network timeout on one source → continue to next feed
- Invalid XML in one feed → log error, continue
- Per-feed rate limit hit → collect error, try remaining feeds
- Missing author data → log warning, include available entries

**Blocking Scenarios:**
- Invalid `feeds.json` schema → caught by `ValidateConfigStep`, fails early
- Filesystem errors (can't read config) → pipeline fails
- Authentication errors → fail immediately (no retry)

---

## GitHub Actions Integration

### Unified Workflow: `aggregate-rss.yml`

Located at: `.github/workflows/aggregate-rss.yml`

Replaces `weekly-feed.yml` and `monthly-feed.yml` with single parametrized workflow:

```yaml
name: Aggregate RSS Feeds

on:
  schedule:
    # Weekly: Thursday 1 AM UTC
    - cron: '0 1 * * 4'
    # Monthly: 1st day 1 AM UTC
    - cron: '0 1 1 * *'

jobs:
  aggregate:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        schedule: ['weekly', 'monthly']
    
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm exec tsx packages/cli/src/cli.ts aggregate
      
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "chore: refresh aggregated RSS feeds"
          file_pattern: 'README.md aggregation-report.json'
```

**Key Features:**
- **Single schedule matrix**: Runs on both weekly and monthly crons
- **Config-driven**: Reads `feeds.json` to determine active feeds
- **Auto-commit**: Updated README committed automatically
- **Report generation**: Optional `aggregation-report.json` saved
- **No hardcoded URLs**: All sources in `feeds.json`

---

## Type Safety & Pipeline Contract

### Extended AggregationData Type

Located at: `packages/cli/src/pipeline-context.ts`

```typescript
export type AggregationData = {
  config?: FeedsConfig;
  bookmarks?: Link[];
  tabs?: Link[];
  links?: Link[];           // ← NEW Phase 2
  errors?: ErrorEntry[];    // ← NEW Phase 2
};

export type Link = {
  title: string;
  url: string;
  source: 'bookmark' | 'tab' | 'rss';
  feedId?: string;          // ← NEW Phase 2: for RSS links
  author?: string;
  publishedAt?: Date;
};
```

**Design Principles:**
- **Immutability via composition**: Steps add data, don't mutate
- **Optional fields**: Links and errors only populated by RSS pipeline
- **Type-safe pipeline**: `TypedPipelineBuilder<AggregationData, AggregationData>` ensures all steps implement Step<T, T>
- **Public API**: AggregationData exported as public type for external consumers

See [PHASE-1-DESIGN.md - Q16 AggregationData API](../../PHASE-1-DESIGN.md#q16-aggregation-data-api) for API design rationale.

---

## CLI Testing: Local Development

### Command: `npx bookmark fetch`

Test RSS fetching without full aggregation:

```bash
# Fetch all configured feeds
pnpm exec tsx packages/cli/src/cli.ts fetch

# Fetch specific feed only
pnpm exec tsx packages/cli/src/cli.ts fetch --feed weekly-digest

# Dry-run (no file writes)
pnpm exec tsx packages/cli/src/cli.ts fetch --dry-run

# Verbose output (detailed per-feed logs)
pnpm exec tsx packages/cli/src/cli.ts fetch --verbose
```

Located at: `packages/cli/src/cli.ts`

```typescript
async function handleFetch(args: string[]) {
  const feedId = args.includes('--feed') 
    ? args[args.indexOf('--feed') + 1]
    : null;
  
  const dryRun = args.includes('--dry-run');
  const verbose = args.includes('--verbose');
  
  const data = new AggregationData();
  data.config = await loadConfig();
  
  const step = new FetchRssStep({ 
    feedFilter: feedId, 
    dryRun, 
    verbose 
  });
  
  await step.run(data);
  
  // Print results
  console.log(`Fetched ${data.links?.length || 0} entries`);
  if (data.errors?.length) {
    console.log(`Errors (${data.errors.length}):`);
    data.errors.forEach(e => console.log(`  - ${e.feedId}: ${e.message}`));
  }
}
```

**Benefits:**
- Catch configuration/parsing errors locally before production
- Test individual feeds without full aggregation
- Debug complex feed parsing issues
- Verify limits and scheduling rules

---

## Implementation Patterns

### Pattern 1: Step Development

All RSS pipeline steps follow this template from [STEP-DEVELOPMENT-GUIDE.md](../../STEP-DEVELOPMENT-GUIDE.md):

```typescript
export class MyRssStep implements Step<AggregationData, AggregationData> {
  constructor(private options?: StepOptions) {}
  
  async run(data: AggregationData): Promise<AggregationData> {
    // 1. Validate inputs
    const config = data.config;
    if (!config) throw new Error("Config not loaded");
    
    // 2. Process (may throw, which fails pipeline)
    const results = await this.process(config);
    
    // 3. Merge results into data
    data = { ...data, ...results };
    
    // 4. Return modified data
    return data;
  }
  
  private async process(config: FeedsConfig): Promise<Partial<AggregationData>> {
    // Implementation
  }
}
```

### Pattern 2: Error Handling Without Failure

For feed processing, catch and collect errors:

```typescript
// ❌ DON'T: Fail on first error
for (const feed of feeds) {
  const result = await fetchFeed(feed); // May throw
}

// ✅ DO: Collect errors per feed
for (const feed of feeds) {
  try {
    const result = await fetchFeed(feed);
    successResults.push(result);
  } catch (error) {
    errorResults.push({
      feedId: feed.id,
      message: error.message
    });
  }
}
data.errors = errorResults;
```

### Pattern 3: Configuration-Driven Behavior

Externalize all config to `feeds.json`:

```typescript
// ❌ DON'T: Hardcode feed URLs
const feeds = [
  'https://example.com/feed1.xml',
  'https://example.com/feed2.xml'
];

// ✅ DO: Load from config
const feeds = data.config?.feeds || [];
for (const feed of feeds) {
  for (const source of feed.sources) {
    const url = source.url;
    const maxEntries = source.maxEntries || 10;
  }
}
```

---

## Cross-References to Phase 1 Foundations

This Phase 2 implementation builds directly on Phase 1 architectural patterns:

| Phase 1 Foundation | Phase 2 Usage |
|---|---|
| **TypedPipelineBuilder** ([Phase B.1](../../ARCHITECTURAL-DEEPENING-OPPORTUNITIES.md#phase-b1-heterogeneous-pipeline-typing)) | All RSS steps implement Step<AggregationData, AggregationData>; preserves type through pipeline |
| **Parser Registry Pattern** ([Phase A.2](../../ARCHITECTURAL-DEEPENING-OPPORTUNITIES.md#phase-a2-parser-registry-pattern)) | `parseRssEntries()` implements entries parser interface for extensibility |
| **Validation Seam** ([Phase A.1](../../ARCHITECTURAL-DEEPENING-OPPORTUNITIES.md#phase-a1-validation-seam)) | `ValidateConfigStep` validates feeds.json before FetchRssStep runs |
| **Opaque Search Abstraction** ([Phase B.2](../../ARCHITECTURAL-DEEPENING-OPPORTUNITIES.md#phase-b2-opaque-search-abstraction)) | Search layer unchanged; RSS links aggregated alongside bookmarks/tabs |
| **Public AggregationData API** ([PHASE-1-DESIGN.md Q16](../../PHASE-1-DESIGN.md#q16-aggregation-data-api)) | Extended with `links?` and `errors?` fields; remains public contract |
| **Three-Source Architecture** ([PHASE-1-DESIGN.md Q5](../../PHASE-1-DESIGN.md#q5-rss-feeds)) | RSS sources now fully integrated via `feeds.json` configuration |

---

## Key Decisions & Rationale

### Decision 1: Built Parser vs External Action

**Decision**: Build internal RssParser instead of using `gautamkrishnar/blog-post-workflow`

**Rationale**:
- Enable internal control over retry logic, timeouts, error handling
- Maintain type safety (ParseResult with errors)
- Extensibility: add new formats (Atom, JSON Feed) without external dependencies
- Privacy: fetch runs in-repo, no external services called
- Error visibility: per-feed error collection instead of binary success/failure

### Decision 2: Single Config File

**Decision**: All configuration in `feeds.json` (no separate YAML)

**Rationale**:
- Single source of truth (feeds.json is already data.json + bookmarks)
- Schema validation easier with one file
- CLI tool can validate before fetching
- CI/CD: one file to check for changes

### Decision 3: Scheduled via GitHub Actions Matrix

**Decision**: Single workflow with schedule matrix instead of separate weekly/monthly workflows

**Rationale**:
- DRY: One workflow definition instead of two nearly-identical workflows
- Maintenance: Updates to aggregation logic in one place
- Extensibility: Easy to add additional schedules (daily, etc.) without new workflow files
- Clear intent: Matrix makes scheduling strategy explicit

### Decision 4: Non-Fatal Per-Feed Errors

**Decision**: One feed failure doesn't block aggregation; errors collected separately

**Rationale**:
- Resilience: Third-party feeds unreliable (timeouts, parsing errors, format changes)
- Visibility: Still see which feeds succeeded/failed
- User value: Get links from working feeds even if one fails
- Debugging: Errors clearly attributed to specific feed + source URL

---

## Testing Strategy

All Phase 2 components fully tested:

### Unit Tests
- `packages/cli/src/steps/__tests__/FetchRssStep.test.ts`: Feed fetching, per-feed limits, error collection
- `packages/parsers/src/__tests__/rss.test.ts`: RSS parsing, entry filtering, error handling
- `packages/cli/src/steps/__tests__/ValidateConfigStep.test.ts`: Schema validation, error messages

### Integration Tests
- `packages/cli/src/__tests__/integration.test.ts`: Full pipeline with RSS feeds
- Mock feeds with various error scenarios (timeouts, invalid XML, missing fields)
- Verify non-fatal errors collected per feed
- Verify one feed failure doesn't block aggregation

### Test Coverage
- 189/189 tests passing
- All RSS pipeline steps covered
- Error paths verified (network failures, parsing errors, invalid config)
- Limits tested (maxEntries, authorMaxEntries)

---

## Future Enhancements (Deferred to Phase 2.2 & 3)

### Phase 2.2: Web UI Feed Management
- Add/remove/edit feeds via web interface
- User preferences storage (favorite feeds, source ordering)
- Feed validation UI (test feed before saving)

### Phase 3: Performance & Monitoring
- Rate limiting per feed source
- Request batching (combine multiple sources)
- Advanced caching (etag, If-Modified-Since)
- Feed health dashboards
- Retry backoff strategies

---

## Summary

Phase 2 delivers a **production-ready, config-driven RSS aggregation system** that:

1. **Extends Phase 1 foundations**: Builds on TypedPipelineBuilder, parser registry, and validation seam patterns
2. **Maintains type safety**: All steps preserve AggregationData type through pipeline
3. **Enables flexible configuration**: feeds.json drives all behavior without code changes
4. **Handles errors gracefully**: Per-feed error collection, non-fatal failures, clear visibility
5. **Integrates with CI/CD**: Unified GitHub Actions workflow, auto-commit, optional reporting
6. **Supports local testing**: CLI fetch command for development and debugging
7. **Scales for future**: Parser registry extensible to new formats, step pattern enables new transforms

The system is ready for production use and provides a solid foundation for Phase 2.2 (web UI) and Phase 3 (performance optimizations).
