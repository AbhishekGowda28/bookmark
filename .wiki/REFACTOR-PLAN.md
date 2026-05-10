# Refactor Plan: Monorepo Architecture & TypeScript Migration

**Date:** May 10, 2026  
**Status:** Planning  
**Branch:** `refactor/monorepo`  
**Objective:** Restructure codebase for scalability, maintainability, and professional standards  

---

## Overview

Transform the current JavaScript monolith into a professionally-structured **pnpm workspace** with **TypeScript** as the foundation. This enables:
- 🏗️ Modular service architecture
- 🔒 Type safety across the entire codebase
- 🔄 Shared packages reusable by web/mobile/future layers
- 🎯 Clean separation of concerns (parsers, core logic, orchestration, UI)
- 🚀 Foundation for Phase 2+ expansion

---

## Architecture Decision Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Monorepo Tool | pnpm workspaces | Pragmatic, minimal overhead, can scale to Nx later |
| Language | Full TypeScript | Type safety as foundation; critical for expansion |
| Service Approach | Functional (not OOP) | Composable, testable, simpler |
| Development Style | Incremental sprints | Always have working code; clear milestones |
| Package Dependencies | Minimal | Only essentials: xml2js, better-sqlite3, markdown-it, fuse.js |
| Feed Configuration | `feeds.json` | Single source of truth, dynamic per-feed + per-author limits |
| RSS Data Pipeline | `rss-entries.json` | Workflows fetch → write JSON; CLI reads + aggregates |
| Future Multi-User | Not in scope | Designed with per-user capability in mind, but Phase 1 is solo |

---

## Workspace Structure

```
bookmark/
├── packages/
│   ├── @bookmark/types/          Universal types, interfaces, schemas
│   ├── @bookmark/utils/          Validation, formatting, helpers
│   ├── @bookmark/parsers/        XbelParser, MarkdownParser, RssEntriesParser
│   ├── @bookmark/core/           Merger, Deduplicator, DatabaseAdapter
│   ├── @bookmark/hooks/          React hooks (useSearch, etc.)
│   └── @bookmark/cli/            Orchestration script for workflows
├── web/                          React app (imports packages)
├── scripts/                       Workflow entry points
├── .github/workflows/            GitHub Actions
├── docs/                         Documentation
├── feeds.json                    RSS feed configuration
├── bookmarks.xbel                Flocuss export (read-only)
├── tabs.xbel                     Browser tabs export (read-only)
├── links.db                      SQLite database (append-only)
├── pnpm-workspace.yaml           Workspace configuration
└── tsconfig.json                 Base TypeScript config
```

---

## Sprint Milestones

### Sprint 1: Foundation Setup
**Goal:** Workspace structure ready, TypeScript compiling  
**Outcome:** All packages created, empty but compilable

**Tasks:**
- Initialize pnpm workspace (`pnpm-workspace.yaml`)
- Create all package folders: types, utils, parsers, core, hooks, cli
- Create `package.json` for each package
- Set up base `tsconfig.json` + package-specific configs
- Configure `tsconfig.json` extends for different targets (Node.js vs React)
- Verify: `pnpm install && pnpm -r tsc --noEmit` passes

**Acceptance Criteria:**
- ✅ Workspace installs without errors
- ✅ All packages compile (TypeScript check passes)
- ✅ Existing Phase 1 code still works (not migrated yet)

---

### Sprint 2: Core Packages & Types
**Goal:** Shared type definitions + utilities ready  
**Outcome:** Other packages can import and use

**Tasks:**
- Migrate `@bookmark/types`: Link interface, Feed interface, Config schema
- Migrate `@bookmark/utils`: validation, formatting, helper functions
- Export types from each package via `index.ts`
- Document package APIs (JSDoc comments)
- Verify: All imports resolve; no circular dependencies

**Acceptance Criteria:**
- ✅ `@bookmark/types` exports: Link, Feed, Config, RssEntry interfaces
- ✅ `@bookmark/utils` exports: validate, format, dedupe helpers
- ✅ All other packages can `import from '@bookmark/types'`
- ✅ No TypeScript errors in workspace

---

### Sprint 3: Business Logic Services
**Goal:** Parsers and core logic migrated to TypeScript  
**Outcome:** Services work in isolation, unit tested

**Tasks:**
- Migrate `@bookmark/parsers`: XbelParser, MarkdownParser functions
- Migrate `@bookmark/core`: Merger, Deduplicator functions
- Write unit tests for each service
- Verify output matches Phase 1 (data integrity check)
- Optimize: Remove dead code, simplify logic

**Acceptance Criteria:**
- ✅ `parseXbel(content: string): Link[]` works correctly
- ✅ `merge(sources: Link[][]): Link[]` produces identical output to Phase 1
- ✅ `deduplicate(links: Link[]): Link[]` produces identical output
- ✅ All services have passing tests
- ✅ No external API changes (same function signatures)

---

### Sprint 4: Orchestration & Data Pipeline
**Goal:** CLI works, workflows updated, new data flow tested  
**Outcome:** End-to-end data pipeline working

**Tasks:**
- Create `feeds.json` schema (per-feed maxEntries, per-author maxEntries, schedule)
- Migrate feed configurations from YAML workflows to `feeds.json`
- Update GitHub workflows (monthly-feed.yml, weekly-feed.yml) to read `feeds.json`
- Implement workflow logic: fetch RSS → write `rss-entries.json`
- Migrate `@bookmark/cli`: orchestrate parsers + core services
- Update GitHub Actions to call new CLI via npm script
- Local test: `pnpm cli` produces correct `data.json`

**Acceptance Criteria:**
- ✅ `feeds.json` is valid and documented
- ✅ `rss-entries.json` generates with correct per-feed + per-author limits
- ✅ GitHub Actions workflows run successfully
- ✅ `data.json` output matches Phase 1 quality
- ✅ Phase 1 web app can load and read new data.json

---

### Sprint 5: React Migration & Integration
**Goal:** Web app uses new workspace packages  
**Outcome:** Web app fully TypeScript, uses shared packages

**Tasks:**
- Migrate `@bookmark/hooks`: useSearch hook to TypeScript
- Migrate `web/src` to TypeScript (.jsx → .tsx)
- Update web imports: use `@bookmark/hooks`, `@bookmark/utils`, `@bookmark/types`
- Verify search functionality works end-to-end
- Build production bundle
- Deploy to GitHub Pages
- Smoke test: Search, load data, verify UX unchanged

**Acceptance Criteria:**
- ✅ Web app builds with zero TypeScript errors
- ✅ Search functionality identical to Phase 1
- ✅ GitHub Pages deployment successful
- ✅ https://abhishekgowda28.github.io/bookmark/ works
- ✅ Live data.json loading and searching works

---

### Sprint 6: Polish & Documentation
**Goal:** Production-ready repository, documented for future  
**Outcome:** Professional codebase, easy to extend

**Tasks:**
- Add ESLint + Prettier config
- Add `.editorconfig` for consistency
- Update root `README.md` with workspace overview
- Create `docs/ARCHITECTURE.md` (how to add new packages)
- Create `docs/DEVELOPMENT.md` (local setup, running CLI, workflows)
- Add JSDoc comments to all public APIs
- Clean up: remove dead code, old JS files (if not needed)
- Verify: `pnpm lint`, `pnpm format` work across workspace

**Acceptance Criteria:**
- ✅ Repository is well-documented
- ✅ New developers can understand structure in 5 minutes
- ✅ Code is formatted and linted
- ✅ All public functions have JSDoc comments
- ✅ `refactor/monorepo` branch is clean, ready to merge to `main`

---

## Feed Configuration Strategy

### `feeds.json` Schema

```json
{
  "feeds": [
    {
      "id": "joel-on-software",
      "author": "Joel Spolsky",
      "authorMaxEntries": 2,
      "sources": [
        {
          "url": "https://www.joelonsoftware.com/feed/",
          "schedule": "monthly",
          "maxEntries": 2
        }
      ]
    },
    {
      "id": "addy-osmani",
      "author": "Addy Osmani",
      "authorMaxEntries": 10,
      "sources": [
        {
          "url": "https://addyosmani.com/feed.xml",
          "schedule": "monthly",
          "maxEntries": 5
        },
        {
          "url": "https://www.youtube.com/feeds/videos.xml?channel_id=...",
          "schedule": "monthly",
          "maxEntries": 8
        }
      ]
    }
  ]
}
```

### How It Works

1. **Workflows read `feeds.json`**
   - `monthly-feed.yml` filters for `schedule: "monthly"`
   - `weekly-feed.yml` filters for `schedule: "weekly"`
   - Each fetches RSS, respects per-feed `maxEntries`

2. **Workflows generate `rss-entries.json`**
   - Merged from all workflows
   - Respects per-author `authorMaxEntries` cap
   - Older entries dropped if limit exceeded

3. **CLI aggregates everything**
   - Reads bookmarks.xbel → uses @bookmark/parsers
   - Reads tabs.xbel → uses @bookmark/parsers
   - Reads rss-entries.json → uses @bookmark/parsers
   - Merges + deduplicates → uses @bookmark/core
   - Outputs data.json

---

## Data Flow Diagram

```
bookmarks.xbel ──┐
                 ├─→ @bookmark/parsers ──┐
tabs.xbel ───────┤                       ├─→ @bookmark/core ──→ data.json
                 ├─→ @bookmark/parsers ──┤  (Merge, Dedup)
                 │                       │
rss-entries.json ┼─→ @bookmark/parsers ──┤
                 │                       │
                 └───────────────────────┘

GitHub Workflows:
feeds.json ──→ monthly-feed.yml ──┐
               weekly-feed.yml  ──┼─→ rss-entries.json
               (Fetch RSS) ───────┘
```

---

## Key Decisions

### Why pnpm workspaces?
- ✅ Pragmatic: minimal config, can graduate to Nx later
- ✅ Efficient: phantom dependencies prevented
- ✅ Performance: fast installs, monorepo deduplication
- ✅ Solo dev: no unnecessary complexity (Nx is enterprise-grade)

### Why full TypeScript?
- ✅ Type safety from day 1 prevents bugs
- ✅ Self-documenting code (types as docs)
- ✅ IDE autocomplete makes development faster
- ✅ Critical for future team/expansion

### Why functional services?
- ✅ Composable: easy to test, easy to reuse
- ✅ Simple: no OOP boilerplate, fewer abstractions
- ✅ Pragmatic: matches the domain (data transformation)

### Why separate `feeds.json` + `rss-entries.json`?
- ✅ `feeds.json` = source of truth for feeds (user-edited)
- ✅ `rss-entries.json` = processed output (generated by workflows)
- ✅ CLI is decoupled from feed fetching (responsibility separation)
- ✅ Easy to debug: each file is independently inspectable

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Breaking Phase 1 mid-refactor | Phase 1 web stays on `main` branch; refactor on `refactor/monorepo` |
| Circular package dependencies | ESLint with dependency-check plugin; manual code review |
| TypeScript migration complexity | Incremental sprints; always have working code |
| Large file churn in git | Separate commits per sprint; clear commit messages |
| Forgetting existing functionality | Sprint 3 includes data integrity checks (old vs new output) |

---

## Success Criteria

- ✅ All code is TypeScript (zero `.js` in packages/)
- ✅ All packages compile with `pnpm -r tsc --noEmit`
- ✅ Web app builds and deploys successfully
- ✅ Search functionality unchanged (user experience identical)
- ✅ `data.json` output identical to Phase 1
- ✅ Repository is documented for future contributors
- ✅ Ready to merge `refactor/monorepo` → `main`

---

## Next Steps

1. ✅ This document complete
2. Break plan into GitHub issues (per sprint)
3. Assign story points / time estimates
4. Begin Sprint 1: Foundation Setup
