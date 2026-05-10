---
title: Phase 2 - RSS Aggregation with Dynamic Config
type: feat
status: active
date: 2026-05-10
---

# Phase 2: RSS Aggregation with Dynamic Config

## Overview

Build RSS feed aggregation using the Phase 1 architectural foundation (parser registry, validation seam, opaque search abstraction, public AggregationData API). Replace hardcoded workflow RSS feeds with dynamic configuration from `feeds.json`. Enable per-feed scheduling, rate limiting, and error handling via CLI tools before exposing to web UI.

## Problem Frame

**Current state:** RSS feeds hardcoded in GitHub Actions workflows. Adding a new feed requires modifying YAML. No local testing tool. No error visibility per feed. Schedule and limits spread across two separate workflows.

**Target:** One unified workflow reading from `feeds.json`. Per-feed configuration (schedule, max entries, rate limits) drives aggregation. Local CLI tool for testing feeds before committing. Error reports per feed. Foundation for future user-facing feed management.

## Requirements Trace

- R1. Dynamic RSS feed configuration from `feeds.json` drives GitHub Actions workflows
- R2. Per-feed schedule (daily, weekly, monthly) determines when feeds are fetched
- R3. Per-feed and per-author entry limits enforced (as configured in `feeds.json`)
- R4. CLI tool supports testing individual feeds locally with error visibility
- R5. RSS parser uses new Phase 1 registry (extendable for new formats)
- R6. Validation uses Phase 1 seam (Zod + type guards)
- R7. Pipeline steps follow AggregationData contract (B.1 foundation)
- R8. Each feed error doesn't crash aggregation (error handling visible in report)
- R9. README updated atomically with new aggregated links
- R10. Local implementation complete before web UI (Phase 2.2)

## Scope Boundaries

- **In scope:** RSS feed ingestion via registry parser, CLI test tool, error handling per feed, dynamic workflow configuration, README generation
- **Out of scope:** Web UI feed management (separate Phase 2.2), advanced filtering/faceting, webhook triggers, user API keys/authentication, feed discovery

### Deferred to Separate Tasks

- **Web UI feed management:** Phase 2.2 (separate PR, builds on this foundation)
- **Performance optimization:** Phase 3 (profiling, caching, batch processing)
- **Feed health monitoring:** Phase 3 (dashboards, alerts, subscription management)

## Context & Research

### Relevant Code and Patterns

- **Parser registry:** `packages/parsers/src/registry.ts` — Already supports `XbelParser`, `MarkdownParser`, `RssParser`. New implementation leverages this.
- **RssParser:** `packages/parsers/src/parsers/rss.ts` — Existing RSS parsing logic (`parseRssEntries`) can be adapted to registry pattern
- **ParseResult:** `packages/parsers/src/registry.ts` — `ParseResult<Link[]>` already captures success + errors per feed
- **Validation:** `packages/validation/src/index.ts` — `FeedSchema`, `ConfigSchema` already defined; use for config validation
- **Pipeline context:** `packages/cli/src/pipeline-context.ts` — `AggregationData` interface with `links`, `errors`, `report` fields
- **CLI pipeline:** `packages/cli/src/index.ts` — Current pipeline: `LoadConfigStep` → `LoadBookmarksStep` → `LoadTabsStep` → `MergeLinksStep`. Phase 2 adds `FetchRssStep`
- **Workflows:** `.github/workflows/weekly-feed.yml`, `.github/workflows/monthly-feed.yml` — Current hardcoded feeds to be replaced

### Institutional Learnings

- **Parser registry pattern** (Phase A.2): New formats registered at runtime without CLI changes. Applied to RSS registry.
- **ParseResult error visibility** (Phase A.2): Separate success/error tracking enables per-feed error reporting without crashing aggregation.
- **Validation seam** (Phase A.1): Single `@bookmark/validation` source of truth. Use `FeedSchema` for config, `LinkSchema` for RSS entries.
- **AggregationData API** (Phase B.1): Pipeline steps read/write via public interface. `FetchRssStep` follows step contract.
- **Pipeline step development** (Phase B.3): 500-line development guide documents step patterns. Reference for `FetchRssStep` implementation.

### External References

- **RSS 2.0 spec:** https://www.rssboard.org/rss-specification
- **Atom 1.0 spec:** https://tools.ietf.org/html/rfc4287
- **Current RSS action:** `gautamkrishnar/blog-post-workflow@v1.9.6` (to be replaced)

## Key Technical Decisions

1. **Leverage parser registry instead of external action** — Use our existing RSS parser (`RssParser`) via registry pattern. Gives us error visibility, rate limiting, and complete control. Removes external action dependency.

2. **Single unified workflow with schedule matrix** — Replace two separate workflows (`weekly-feed.yml`, `monthly-feed.yml`) with one parametrized workflow that reads `feeds.json` and runs scheduled jobs per feed based on schedule field.

3. **CLI test tool before web UI** — Build `npx bookmark fetch --feed <id>` before exposing web UI. Proves the implementation end-to-end, catches issues in production early, enables debugging.

4. **Error per feed, not aggregate** — Use `ParseResult` to collect errors. Each feed's fetch failure is logged, reported, but doesn't block other feeds. Aggregation continues.

5. **Config validation as prerequisite step** — Run `ValidateConfigStep` (Phase C.2 foundation) before fetching to ensure `feeds.json` is valid. Catches config errors early.

6. **Per-feed rate limiting via config** — Store rate limit settings in `feeds.json` (current: `schedule` + `maxEntries`). CLI respects limits during testing; workflow respects limits during scheduled runs.

## High-Level Technical Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        GitHub Actions Workflow                              │
│                      (weekly and monthly unified)                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
                    ┌───────────────────────────────────┐
                    │  1. Load & Validate Config        │
                    │     (ValidateConfigStep)          │
                    └───────────────────────────────────┘
                                    ↓
                ┌───────────────────────────────────────────────────┐
                │  2. Filter Feeds by Schedule                      │
                │     (weekly-feed.yml: schedule=weekly,daily)      │
                │     (monthly-feed.yml: schedule=monthly)          │
                └───────────────────────────────────────────────────┘
                                    ↓
                ┌───────────────────────────────────────────────────┐
                │  3. For Each Feed: Fetch & Parse                  │
                │     FetchRssStep                                  │
                │     ├─ per feed: GET RSS URL                      │
                │     ├─ per feed: Parse via RssParser registry     │
                │     ├─ per feed: Apply per-feed maxEntries limit  │
                │     ├─ per feed: Collect ParseResult (links+errs) │
                │     └─ continue on error (no crash)               │
                └───────────────────────────────────────────────────┘
                                    ↓
                ┌───────────────────────────────────────────────────┐
                │  4. Apply Per-Author Limits                       │
                │     (authorMaxEntries config per feed)            │
                │     LimitStep                                     │
                └───────────────────────────────────────────────────┘
                                    ↓
                ┌───────────────────────────────────────────────────┐
                │  5. Merge with Existing (Bookmarks + Tabs)        │
                │     MergeLinksStep                                │
                │     └─ deduplicate by URL                         │
                └───────────────────────────────────────────────────┘
                                    ↓
                ┌───────────────────────────────────────────────────┐
                │  6. Generate Report & Update README               │
                │     GenerateReportStep                            │
                │     └─ format links per author tag in README      │
                └───────────────────────────────────────────────────┘

Local CLI: npx bookmark fetch [--feed <id>] [--dry-run]
           Runs same pipeline locally for testing
```

## Implementation Units

- [ ] **Unit 1: Refactor RssParser to Use Registry Pattern**

**Goal:** Update `RssParser` to implement unified `Parser` interface and register with `ParserRegistry`

**Requirements:** R5, R8

**Dependencies:** None (Phase A.2 work already complete)

**Files:**
- Modify: `packages/parsers/src/parsers/rss.ts`
- Modify: `packages/parsers/src/registry.ts`
- Modify: `packages/parsers/src/index.test.ts`
- Test: `packages/parsers/src/parsers/rss.test.ts`

**Approach:**
- `RssParser` class implements `Parser` interface (from Phase A.2)
- Constructor accepts `RssParserOptions` (rate limit config, timeout)
- `parse(entries: RssEntry[]): Promise<ParseResult<Link[]>>` method processes RSS entries
- Returns `ParseResult<Link[]>` with success links and any errors (invalid entries, parse failures)
- Register `RssParser` as singleton in parser registry so CLI and workflows use consistent instance
- Update tests to verify error handling (malformed entries don't crash parser)

**Patterns to follow:**
- `XbelParser`, `MarkdownParser` implementations (Phase A.2)
- `ParseResult` error handling pattern (Phase A.2)

**Test scenarios:**
- Happy path: Valid RSS entries → produces Link[] with no errors
- Edge case: Empty RSS entries array → produces empty Link[], no errors
- Edge case: Partial invalid entries → produces valid links, collects errors for invalid ones
- Error path: Network timeout → returns ParseResult with timeout error
- Error path: Malformed XML → returns ParseResult with parse error
- Integration: Rate limiting flag in options is respected (future verification in Unit 4)

---

- [ ] **Unit 2: Create FetchRssStep Pipeline Step**

**Goal:** Implement `FetchRssStep` that fetches and parses RSS feeds for all configured sources

**Requirements:** R2, R3, R4, R7, R8

**Dependencies:** Unit 1

**Files:**
- Create: `packages/cli/src/steps/FetchRssStep.ts`
- Create: `packages/cli/src/steps/FetchRssStep.test.ts`
- Modify: `packages/cli/src/index.ts` (add to pipeline)

**Approach:**
- `FetchRssStep` implements `Step<AggregationData>` interface (from Phase B.3)
- Input: `AggregationData.config` (feeds.json structure with sources, schedules, maxEntries)
- Per feed:
  - Filter by schedule (only process feeds matching current schedule)
  - For each source in feed.sources:
    - Fetch RSS XML from URL (with timeout, retry logic)
    - Parse with `RssParser` registry
    - Apply `feed.sources[].maxEntries` limit (take top N entries)
    - Collect in `ParseResult`
  - Apply `feed.authorMaxEntries` limit across all sources for that author
- Output: Add fetched links to `AggregationData.links`, errors to `AggregationData.errors`
- Continue on error: One feed error doesn't block others

**Execution note:** Implement with error-first approach. Write tests for error scenarios before fetching logic.

**Patterns to follow:**
- `LoadBookmarksStep`, `LoadTabsStep` (existing step patterns)
- `AggregationData` contract (Phase B.1 documentation)
- Step error handling from Phase B.3 guide

**Technical design:**
```typescript
// Pseudo-code
class FetchRssStep implements Step<AggregationData> {
  async execute(data: AggregationData): Promise<StepResult<AggregationData>> {
    const config = getConfig(data); // Phase B.1 helper
    const result = {
      data,
      errors: []
    };
    
    for (const feed of config.feeds) {
      for (const source of feed.sources) {
        if (!matchesSchedule(source.schedule)) continue;
        try {
          const xml = await fetchWithTimeout(source.url);
          const entries = parseXml(xml); // Parse to RssEntry[]
          const parsed = this.rssParser.parse(entries); // Phase A.2 registry
          
          // Apply limits
          const limited = applyMaxEntries(parsed.data, source.maxEntries);
          result.data.links.push(...limited);
          
          if (parsed.errors.length > 0) {
            result.errors.push({
              feed: feed.id,
              source: source.url,
              details: parsed.errors
            });
          }
        } catch (err) {
          result.errors.push({
            feed: feed.id,
            source: source.url,
            error: err.message
          });
        }
      }
      
      // Apply per-author limit
      result.data.links = applyAuthorMaxEntries(
        result.data.links,
        feed.author,
        feed.authorMaxEntries
      );
    }
    
    return result;
  }
  
  private matchesSchedule(schedule: 'daily' | 'weekly' | 'monthly'): boolean {
    // Implement schedule matching logic
    // For local CLI: always true
    // For GitHub Actions: check cron context
  }
}
```

**Test scenarios:**
- Happy path: Valid feed sources, valid RSS entries → links added, no errors
- Edge case: No feeds with matching schedule → no links added, no errors
- Edge case: Feed with zero maxEntries → feed skipped (limit enforced)
- Error path: Network timeout on one feed → error collected, other feeds continue
- Error path: Malformed XML → error collected, other feeds continue
- Error path: All feeds fail → aggregation still has bookmarks + tabs, errors reported
- Integration: Per-feed limits (source.maxEntries) applied correctly
- Integration: Per-author limits (feed.authorMaxEntries) applied after all sources for that author

---

- [ ] **Unit 3: Create CLI Fetch Command for Local Testing**

**Goal:** Build `npx bookmark fetch` CLI command to test RSS feeds locally

**Requirements:** R4, R7, R8

**Dependencies:** Unit 2

**Files:**
- Modify: `packages/cli/src/index.ts` (add fetch command)
- Create: `packages/cli/src/commands/fetch.ts`
- Modify: `packages/cli/src/index.test.ts`

**Approach:**
- New CLI command: `npx bookmark fetch [--feed <id>] [--dry-run] [--verbose]`
- `--feed <id>`: Test specific feed (optional; default: all)
- `--dry-run`: Don't write to `data.json`; only report output
- `--verbose`: Show per-feed timing, error details
- Runs full pipeline locally: config validation → bookmarks → tabs → RSS fetch → limit → merge → report
- Outputs:
  - Fetched link count per feed
  - Errors per feed (if any)
  - Total unique links
  - Time elapsed
  - Dry-run preview: what would be written to `data.json` and README

**Patterns to follow:**
- Existing CLI patterns in `packages/cli/src/index.ts`
- Pipeline execution from `packages/pipeline/src/index.ts`

**Test scenarios:**
- Happy path: `fetch` with valid config → reports links per feed, success
- Edge case: `fetch --feed <non-existent-id>` → error message
- Edge case: `fetch --dry-run` → no file changes, output only
- Error path: `fetch` with invalid config → validation error before fetching
- Integration: `fetch --verbose` shows per-feed timing and error details

---

- [ ] **Unit 4: Unified GitHub Actions Workflow (Schedule Matrix)**

**Goal:** Replace two separate workflows with single parametrized workflow reading `feeds.json`

**Requirements:** R1, R2, R3, R6, R9

**Dependencies:** Unit 2, Unit 3

**Files:**
- Create: `.github/workflows/aggregate-rss.yml` (new unified workflow)
- Delete: `.github/workflows/weekly-feed.yml` (replaced)
- Delete: `.github/workflows/monthly-feed.yml` (replaced)
- Modify: `.gitignore` (if needed; likely unchanged)

**Approach:**
- New workflow: `aggregate-rss.yml`
- Two scheduled jobs:
  - `fetch-weekly`: Cron `0 * * * thu` (every Thursday at midnight UTC)
    - Sets environment: `SCHEDULE=weekly,daily` (fetch feeds with weekly or daily schedule)
  - `fetch-monthly`: Cron `0 0 1 * *` (first day of month at midnight UTC)
    - Sets environment: `SCHEDULE=monthly` (fetch only monthly feeds)
- Both jobs:
  1. Checkout repo
  2. Install dependencies (node + pnpm)
  3. Run: `npx bookmark fetch --schedule $SCHEDULE`
  4. Commit and push if changes
  5. (Optional) Post aggregation report as comment on PR or workflow summary

**Patterns to follow:**
- GitHub Actions official documentation
- Current workflow patterns (`.github/workflows/deploy.yml`)

**Technical design:**
```yaml
# .github/workflows/aggregate-rss.yml
name: Aggregate RSS Feeds
on:
  schedule:
    - cron: '0 * * * thu'    # Weekly
    - cron: '0 0 1 * *'      # Monthly
  workflow_dispatch:         # Manual trigger

jobs:
  fetch-rss:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup  # Reuse setup action if it exists
      - run: npm run build
      - run: npx bookmark fetch
      - uses: stefanzweifel/git-auto-commit-action@v5
        if: always()
        with:
          commit_message: "chore: Update RSS feeds"
          file_pattern: "README.md data.json"
```

**Test scenarios:**
- Manual trigger: Workflow runs successfully, updates README
- Scheduled weekly: Runs on Thursday, fetches weekly/daily feeds
- Scheduled monthly: Runs on 1st of month, fetches monthly feeds
- Error handling: If fetch fails, workflow still commits error report
- Idempotence: Running twice with no new entries makes no changes

---

- [ ] **Unit 5: Update README Generation for RSS Links**

**Goal:** Format fetched RSS links in README with author sections and entry counts

**Requirements:** R1, R9

**Dependencies:** Unit 2, Unit 4

**Files:**
- Modify: `packages/core/src/index.ts` (README generation logic if exists)
- Or create: `packages/cli/src/steps/GenerateReadmeStep.ts` (if not in Unit 2)
- Modify: `README.md` (add sections for each RSS author)

**Approach:**
- For each feed in `config.feeds`:
  - Create section: `## [Author Name]`
  - List links (up to `authorMaxEntries`)
  - Wrap in HTML comment markers: `<!-- [feed-id]:START -->` ... `<!-- [feed-id]:END -->`
  - Comment markers used by GitHub Actions auto-commit to detect changed sections
- Preserve existing bookmark sections unchanged
- Use `<!-- [feed-id]:START -->` convention for easy detection and replacement

**Patterns to follow:**
- Current README markers (look for `<!-- <tag>:START -->` patterns)
- Link formatting from existing aggregated entries

**Test scenarios:**
- Happy path: Aggregate 3 feeds, README has 3 author sections with links
- Edge case: One feed has zero links → section still appears but empty
- Error path: Feed had errors during fetch → section shows "Last updated: [date] with errors"
- Integration: README commit includes changed sections only

---

- [ ] **Unit 6: Config Validation and Error Reporting**

**Goal:** Validate `feeds.json` early; report validation errors before fetching

**Requirements:** R6, R8

**Dependencies:** Unit 1, Unit 2

**Files:**
- Modify: `packages/cli/src/index.ts` (add ValidateConfigStep to pipeline if not already there)
- Modify: `packages/cli/src/index.test.ts`

**Approach:**
- `ValidateConfigStep` (from Phase C.2) validates `feeds.json` schema:
  - At least one feed
  - Each feed has id, author, authorMaxEntries > 0
  - Each feed has at least one source
  - Each source has valid URL, schedule (daily/weekly/monthly), maxEntries > 0
- Throws on validation failure (prevents aggregation with bad config)
- Returns structured error report (per-feed, per-source)

**Patterns to follow:**
- `ValidateConfigStep` from Phase C.2
- Validation seam from Phase A.1 (`FeedSchema`, `ConfigSchema`)

**Test scenarios:**
- Happy path: Valid `feeds.json` → validation passes
- Error path: Missing feeds array → validation fails with clear message
- Error path: Feed missing author → validation fails with clear message
- Error path: Invalid schedule value → validation fails with clear message
- Integration: Validation runs before `FetchRssStep` in pipeline

---

- [ ] **Unit 7: Error Handling and Reporting**

**Goal:** Collect per-feed errors; make them visible in CLI output and workflow logs

**Requirements:** R8

**Dependencies:** Unit 2, Unit 3, Unit 5

**Files:**
- Modify: `packages/cli/src/index.ts` (add error reporting to fetch output)
- Create: `packages/cli/src/reporters/AggregationReporter.ts` (format output)

**Approach:**
- After aggregation completes:
  - Count links per feed (success)
  - Count errors per feed
  - Report: "✓ Feed: 12 links, 0 errors" or "✗ Feed: 5 links, 2 errors: [details]"
  - Summary: "Total: 45 links aggregated, 3 feeds with errors"
- CLI output at end of `fetch` command
- In workflow: log as workflow summary or annotation

**Patterns to follow:**
- Error format from `ParseResult` (Phase A.2)
- AggregationData.errors structure

**Test scenarios:**
- Happy path: All feeds success → report shows "0 errors"
- Error path: One feed fails → report shows feed name and error details
- Error path: Multiple errors in same feed → report aggregates them
- Integration: Error report appears in CLI output and workflow logs

---

## System-Wide Impact

- **Interaction graph:**
  - CLI `fetch` command → Parser registry (Unit 1) → FetchRssStep (Unit 2) → README generation (Unit 5)
  - GitHub Actions workflow (Unit 4) → calls CLI fetch → generates README
  - Config validation (Unit 6) → runs before FetchRssStep (Unit 2)

- **Error propagation:**
  - Per-feed errors in `ParseResult` → collected in `AggregationData.errors` (Unit 2)
  - Validation errors → thrown early, block aggregation (Unit 6)
  - RSS fetch errors → caught, reported per feed, aggregation continues (Unit 2)

- **State lifecycle risks:**
  - Duplicate links: Handled by existing `MergeLinksStep` deduplication (by URL)
  - Partial writes: CLI `--dry-run` mode prevents accidental changes
  - README consistency: Atomic commit of README + data.json ensures no orphaned markers

- **API surface parity:**
  - `feeds.json` schema: Already defined in Phase 1 (`FeedSchema`, `ConfigSchema`)
  - CLI contract: `npx bookmark fetch` follows existing CLI patterns
  - Step interface: `FetchRssStep` follows `Step<AggregationData>` contract (Phase B.3)

- **Unchanged invariants:**
  - Bookmarks and tabs loading unchanged (Unit 2 adds to existing pipeline, doesn't replace)
  - Existing link deduplication unchanged
  - README format preserved (only add new author sections)

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| **RSS feed source instability** — Feeds may timeout, be removed, or return malformed XML | Per-feed error collection (Unit 2); aggregation continues on feed-level errors; CLI dry-run for testing before workflow |
| **Rate limiting** — Fetching all feeds at once may hit rate limits or slow down workflow | Schedule matrix (Unit 4) staggers weekly vs. monthly; future: add exponential backoff and request batching (Phase 3) |
| **README merge conflicts** — Many concurrent feeds updating README could cause git conflicts | Use HTML comment markers for section detection; atomic commit ensures one aggregation at a time |
| **Config drift** — `feeds.json` and GitHub Actions hardcoded feeds get out of sync | Single source of truth: workflows read `feeds.json` (Unit 4); delete old hardcoded workflows; document in CONTRIBUTING.md |
| **Breaking schema changes** — Changing `feeds.json` structure later breaks workflow | Validate schema early (Unit 6); use clear migration path in future; document in ADR |

## Documentation / Operational Notes

- **CONTRIBUTING.md update:** Add section on adding new RSS feeds:
  1. Add entry to `feeds.json`
  2. Run `npx bookmark fetch --dry-run --feed <id>` to test locally
  3. Commit and push; workflow runs automatically
  
- **ADR / Architecture documentation:**
  - Document decision to use parser registry instead of external action
  - Document schedule matrix approach for unified workflow
  
- **README.**
  - Note that RSS sections are auto-generated by workflow; do not edit manually
  - Link to `feeds.json` for feed configuration

## Deferred Implementation Notes

- **Exact helper function names:** Finalize `matchesSchedule()`, `applyMaxEntries()`, `applyAuthorMaxEntries()` signatures during Unit 2 implementation
- **Rate limiting config:** Current `feeds.json` has schedule + maxEntries; rate limiting (e.g., min delay between requests per domain) deferred to Phase 3 optimization
- **Webhook triggers:** Current approach is cron-based; webhook triggers (e.g., PubSubHubbub) deferred to Phase 3
- **User-facing API keys:** Web UI for adding/removing feeds deferred to Phase 2.2

---

## Implementation Sequencing

**Phase 2.1 (CLI + Workflows)** — This plan (Units 1–7)
- Build RssParser registry (Unit 1)
- Implement FetchRssStep (Unit 2)
- CLI fetch command (Unit 3)
- Unified workflow (Unit 4)
- README generation (Unit 5)
- Config validation (Unit 6)
- Error reporting (Unit 7)

**Phase 2.2 (Web UI — Separate PR)**
- Build React UI for feed management
- API endpoint to list/add/remove feeds
- Settings page for feed configuration

**Phase 3 (Optimization)**
- Rate limiting and request batching
- Performance profiling
- Caching layer

---

## Success Criteria

- [ ] `npx bookmark fetch` runs successfully locally and updates `data.json` + `README.md`
- [ ] `npx bookmark fetch --feed <id>` tests a single feed
- [ ] `npx bookmark fetch --dry-run` previews changes without writing
- [ ] GitHub Actions workflow runs on schedule; no more hardcoded feeds in YAML
- [ ] Per-feed errors reported; one feed failure doesn't block others
- [ ] All 189 existing tests pass (no regressions)
- [ ] 30+ new tests for RSS-specific logic (FetchRssStep, error handling, scheduling)
- [ ] `feeds.json` is the single source of truth for feed configuration
- [ ] Foundation ready for Phase 2.2 (web UI)

---

## Sources & References

- **Phase 1 output:** `docs/STEP-DEVELOPMENT-GUIDE.md` — How to write pipeline steps
- **Current workflows:** `.github/workflows/weekly-feed.yml`, `.github/workflows/monthly-feed.yml`
- **Feed config:** `feeds.json`
- **Parser registry:** `packages/parsers/src/registry.ts`
- **RssParser:** `packages/parsers/src/parsers/rss.ts`
- **Pipeline context:** `packages/cli/src/pipeline-context.ts`
- **Related ADRs:** TBD (to be created as part of implementation)
