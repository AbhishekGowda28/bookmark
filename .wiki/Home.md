# Bookmark & RSS Aggregator Documentation

Welcome to the Bookmark and RSS Aggregator wiki. This is the central hub for project documentation, architectural decisions, and learnings.

## Quick Navigation

### Phase Documentation
- **[Phase 1: Architectural Deepening](PHASE-1-DESIGN.md)** - Established three-source link aggregation system with 677 deduplicated links
- **[Phase 2: Config-Driven RSS Aggregation](solutions/best-practices/config-driven-rss-aggregation.md)** - Dynamic feed management via feeds.json, per-feed limits, error resilience

### Architecture & Design
- **[Context & Domain Language](CONTEXT.md)** - Core entities: Link, Source, Feed, Format, Aggregation, Searcher, Validation
- **[Architectural Deepening Opportunities](ARCHITECTURAL-DEEPENING-OPPORTUNITIES.md)** - Identified friction points and solutions (9 deepening candidates)
- **[Phase 1 PRD](PHASE-1-PRD.md)** - Requirements for searchable link aggregator (MVP complete)

### Development Guides
- **[Step Development Guide](STEP-DEVELOPMENT-GUIDE.md)** - How to write custom pipeline steps (Load, Transform, Validate, Output patterns)
- **[Refactor Plan](REFACTOR-PLAN.md)** - Architecture improvements and evolution strategy

### Planning & Tracking
- **[Kanban Board](KANBAN.md)** - Current sprint progress and issue tracking
- **[Issues Log](ISSUES.md)** - Detailed issue definitions and requirements

---

## Phase Status

### ✅ Phase 1: Searchable Link Aggregator (Complete)
- **Date Completed:** May 9, 2026
- **Status:** All 9 issues complete, PR #19 merged
- **Tests:** 189/189 passing
- **Achievements:**
  - Three-source aggregation (bookmarks, tabs, RSS)
  - Parser registry pattern
  - Typed pipeline framework
  - Full-text search with Fuse.js
  - React UI deployed to GitHub Pages

### ✅ Phase 2: Config-Driven RSS Aggregation (Complete)
- **Date Completed:** May 10, 2026
- **Status:** All 7 implementation units complete, PR #20 merged
- **Tests:** 189/189 passing
- **Key Features:**
  - Dynamic `feeds.json` configuration
  - Per-feed and per-author entry limits
  - Non-fatal error handling (per-feed error collection)
  - CLI test tool (`npx bookmark fetch`)
  - Unified GitHub Actions workflow
  - Per-feed aggregation reporting

---

## Core Concepts

### Link Aggregation Pipeline
```
Initialize → LoadConfig → ValidateConfig → LoadBookmarks → LoadTabs 
→ FetchRss → MergeLinks → GenerateReadme → AggregationReport
```

### Three Link Sources
1. **Bookmarks** - User-maintained browser bookmarks (`bookmarks.xbel`)
2. **Tabs** - Currently open browser tabs (`tabs.xbel`)
3. **RSS Feeds** - Programmatically fetched entries via `feeds.json` configuration

---

**Last Updated:** May 10, 2026  
**Status:** Phase 2 Complete, Ready for Phase 2.2 Planning
