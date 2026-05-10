# GitHub Issues: Monorepo Refactor

These issues implement the [REFACTOR-PLAN.md](./REFACTOR-PLAN.md) as vertical slices. Publish in order (blockers first).

---

## Issue 1: Initialize pnpm Workspace

**Type:** HITL (infrastructure setup)  
**Blocked by:** None - Start immediately  
**Related sprint:** Sprint 1: Foundation Setup

### What to build

Set up pnpm as the monorepo tool. Create the workspace configuration and base TypeScript configuration so all packages can be initialized and compile correctly.

End result: `pnpm install` works, `pnpm -r tsc --noEmit` passes (even though packages are empty).

### Acceptance criteria

- [ ] Create `pnpm-workspace.yaml` that includes all package directories
- [ ] Create base `tsconfig.json` at repo root with strict mode enabled
- [ ] Each package has its own `package.json` and `tsconfig.json`
- [ ] `@bookmark/types` package created with name in package.json
- [ ] `@bookmark/utils` package created with name in package.json
- [ ] `@bookmark/parsers` package created with name in package.json
- [ ] `@bookmark/core` package created with name in package.json
- [ ] `@bookmark/hooks` package created with name in package.json
- [ ] `@bookmark/cli` package created with name in package.json
- [ ] `pnpm install` completes without errors
- [ ] `pnpm -r tsc --noEmit` passes (no compilation errors)

---

## Issue 2: Migrate Types and Utils Packages

**Type:** AFK (implementation)  
**Blocked by:** Issue #1 (Initialize pnpm Workspace)  
**Related sprint:** Sprint 2: Core Packages & Types

### What to build

Create `@bookmark/types` and `@bookmark/utils` packages with full TypeScript. These are the foundation that other packages depend on.

- `@bookmark/types`: Link, Feed, RssEntry, Config interfaces
- `@bookmark/utils`: validation, formatting, helper functions

End result: All other packages can `import from '@bookmark/types'` and `import from '@bookmark/utils'` with zero errors.

### Acceptance criteria

- [ ] `@bookmark/types` exports Link interface with id, title, url, source, feed (optional) fields
- [ ] `@bookmark/types` exports Feed interface with id, author, authorMaxEntries, sources array
- [ ] `@bookmark/types` exports RssEntry interface
- [ ] `@bookmark/utils` exports validate functions (validateLink, validateFeed, validateConfig)
- [ ] `@bookmark/utils` exports format functions (formatUrl, formatDate, etc.)
- [ ] `@bookmark/utils` exports helper functions (isDuplicate, mergeObjects, etc.)
- [ ] Both packages have proper exports via `index.ts`
- [ ] `pnpm -r tsc --noEmit` passes for entire workspace
- [ ] JSDoc comments added to all public functions

---

## Issue 3: Migrate Parsers Service

**Type:** AFK (implementation + testing)  
**Blocked by:** Issue #2 (Migrate Types and Utils)  
**Related sprint:** Sprint 3: Business Logic Services

### What to build

Convert `@bookmark/parsers` to TypeScript with functional exports:
- `parseXbel(content: string): Link[]`
- `parseMarkdown(content: string): Link[]`
- `parseRssEntries(entries: RssEntry[]): Link[]`

Verify output matches Phase 1 exactly (data integrity test).

End result: Parsers work identically to Phase 1, all tests pass.

### Acceptance criteria

- [ ] `parseXbel()` function converts XBEL XML to Link[] (uses xml2js)
- [ ] `parseMarkdown()` function extracts links from markdown
- [ ] `parseRssEntries()` function converts RSS entries to Link[] format
- [ ] Unit tests for each parser function (compare to Phase 1 data)
- [ ] Data integrity test: Run parsers on sample data, output matches Phase 1
- [ ] Functions use `@bookmark/types` Link interface
- [ ] Functions use `@bookmark/utils` for validation
- [ ] `pnpm -r tsc --noEmit` passes
- [ ] All tests passing: `pnpm -r test` (or similar)

---

## Issue 4: Migrate Core Services

**Type:** AFK (implementation + testing)  
**Blocked by:** Issue #2 (Migrate Types and Utils)  
**Related sprint:** Sprint 3: Business Logic Services

### What to build

Convert `@bookmark/core` to TypeScript with functional exports:
- `merge(sources: Link[][]): Link[]`
- `deduplicate(links: Link[]): Link[]`
- Database adapter functions (if needed for Phase 2)

Verify output matches Phase 1 exactly (data integrity test).

End result: Core logic works identically to Phase 1, all tests pass.

### Acceptance criteria

- [ ] `merge()` function combines multiple Link[] arrays while preserving order
- [ ] `deduplicate()` function removes duplicate links by URL (uses @bookmark/utils)
- [ ] Unit tests for each function (compare to Phase 1 data)
- [ ] Data integrity test: Merged + deduplicated output matches Phase 1
- [ ] Functions use `@bookmark/types` Link interface
- [ ] Functions use `@bookmark/utils` for validation/helpers
- [ ] `pnpm -r tsc --noEmit` passes
- [ ] All tests passing

---

## Issue 5: Create feeds.json + Update Workflows + Migrate CLI

**Type:** HITL (requires workflow configuration decisions)  
**Blocked by:** Issue #3 (Parsers) + Issue #4 (Core)  
**Related sprint:** Sprint 4: Orchestration & Data Pipeline

### What to build

1. Create `feeds.json` configuration file with schema for per-feed + per-author limits
2. Update GitHub workflows (monthly-feed.yml, weekly-feed.yml) to read `feeds.json`
3. Workflows generate `rss-entries.json` instead of writing directly to README
4. Migrate `@bookmark/cli` orchestrator that:
   - Reads bookmarks.xbel, tabs.xbel, rss-entries.json
   - Uses parsers + core to merge/deduplicate
   - Outputs data.json

End result: Full end-to-end data pipeline works. `data.json` generates correctly locally and via GitHub Actions.

### Acceptance criteria

- [ ] `feeds.json` created with correct schema (per-feed maxEntries, per-author max, schedule, sources)
- [ ] `feeds.json` validated with sample data (at least 3 authors with multiple feeds each)
- [ ] GitHub workflows read `feeds.json` dynamically
- [ ] Workflows generate `rss-entries.json` with enforced limits
- [ ] `@bookmark/cli` exports `generate()` function that orchestrates the pipeline
- [ ] CLI reads bookmarks.xbel, tabs.xbel, rss-entries.json
- [ ] CLI uses @bookmark/parsers + @bookmark/core
- [ ] CLI outputs data.json
- [ ] Local test: `pnpm cli` produces valid data.json
- [ ] GitHub Actions workflow runs successfully and generates data.json
- [ ] `data.json` output quality matches or exceeds Phase 1

---

## Issue 6: Migrate Web App to TypeScript

**Type:** AFK (implementation)  
**Blocked by:** Issue #5 (CLI + Workflows)  
**Related sprint:** Sprint 5: React Migration & Integration

### What to build

Convert web app to TypeScript and integrate with workspace packages:
- Migrate `web/src/**/*.jsx` → `.tsx`
- Migrate `@bookmark/hooks` (useSearch to TypeScript)
- Update web imports to use `@bookmark/hooks`, `@bookmark/utils`, `@bookmark/types`
- Verify search works identically to Phase 1
- Deploy to GitHub Pages

End result: Web app is fully TypeScript, loads new data.json, search works perfectly.

### Acceptance criteria

- [ ] All `.jsx` files converted to `.tsx`
- [ ] `App.tsx` uses correct import from `@bookmark/hooks`
- [ ] `web/src/App.tsx` uses `import { useSearch } from '@bookmark/hooks'`
- [ ] `web/src/components/**/*.tsx` exist and are properly typed
- [ ] `useSearch` hook exported from `@bookmark/hooks` package
- [ ] Search functionality identical to Phase 1 (no regression)
- [ ] `npm run build` produces dist/ successfully
- [ ] GitHub Pages deployment successful
- [ ] https://abhishekgowda28.github.io/bookmark/ loads and searches work
- [ ] Data.json loads correctly from new pipeline
- [ ] Browser console has no errors

---

## Issue 7: Add Linting, Prettier, and Documentation

**Type:** AFK (configuration + documentation)  
**Blocked by:** Issue #6 (Web App Migration)  
**Related sprint:** Sprint 6: Polish & Documentation

### What to build

Establish code quality standards and document the repository for future developers:
- ESLint + Prettier configuration across all packages
- JSDoc comments on all public APIs
- Architecture documentation (how to add new packages)
- Development guide (local setup, running CLI, workflows)
- Clean up old Phase 1 code (if not needed)

End result: Repository is professional, well-documented, ready for contributions.

### Acceptance criteria

- [ ] `.eslintrc.json` created at repo root
- [ ] `.prettierrc.json` created at repo root
- [ ] `pnpm lint` runs across all packages
- [ ] `pnpm format` runs and formats all files
- [ ] Pre-commit hook added (optional but recommended)
- [ ] `docs/ARCHITECTURE.md` explains workspace structure + how to add packages
- [ ] `docs/DEVELOPMENT.md` explains local setup, CLI usage, workflow testing
- [ ] All public functions have JSDoc comments with @param, @returns
- [ ] Root `README.md` updated with workspace overview
- [ ] Dead code removed (old Phase 1 JS files if not needed)
- [ ] `pnpm lint` passes with zero errors/warnings
- [ ] Code formatted consistently (check `pnpm format --check`)

---

## Issue Publishing Order

1. **Issue #1:** Initialize pnpm Workspace (foundational)
2. **Issue #2:** Migrate Types and Utils (foundational dependency)
3. **Issue #3:** Migrate Parsers (depends on #2)
4. **Issue #4:** Migrate Core (depends on #2)
5. **Issue #5:** Feeds.json + Workflows + CLI (depends on #3, #4)
6. **Issue #6:** Migrate Web App (depends on #5)
7. **Issue #7:** Linting + Documentation (depends on #6, polishing)

---

## Labels to Apply (recommended)

- `refactor/monorepo` - All issues for this initiative
- `type:infrastructure` - Issues #1, #5
- `type:implementation` - Issues #2, #3, #4, #6, #7
- `scope:backend` - Issues #3, #4, #5
- `scope:frontend` - Issue #6
- `priority:high` - All (blocking Phase 2)

---

## Estimated Timeline

- Issue #1: 30 min
- Issue #2: 1-2 hours
- Issue #3: 2-3 hours (includes testing)
- Issue #4: 2-3 hours (includes testing)
- Issue #5: 3-4 hours (workflow config + CLI)
- Issue #6: 2-3 hours (mostly mechanical migration)
- Issue #7: 1-2 hours (docs + linting)

**Total: ~14-18 hours** (can be done over several days)
