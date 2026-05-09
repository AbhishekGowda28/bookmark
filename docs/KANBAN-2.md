# KANBAN-2: Monorepo Refactor & TypeScript Migration

**Status:** Planning Complete → Ready for Execution  
**Branch:** `refactor/monorepo`  
**Total Issues:** 7 (all AFK - Autonomous executable)  
**Estimated Duration:** 14-18 hours  

---

## Kanban Board

### 📋 NOT STARTED

#### Issue #1: Initialize pnpm Workspace
- **Type:** AFK (autonomous executable)
- **Blocked by:** None - Can start immediately
- **Estimated time:** 30 min
- **Dependencies:** None
- **Acceptance criteria:**
  - [ ] Create `pnpm-workspace.yaml`
  - [ ] Create base `tsconfig.json` (strict mode)
  - [ ] All 6 packages created with folder structure
  - [ ] Each package has `package.json` and `tsconfig.json`
  - [ ] `pnpm install` completes without errors
  - [ ] `pnpm -r tsc --noEmit` passes (all packages compile)

---

#### Issue #2: Migrate Types and Utils Packages
- **Type:** AFK
- **Blocked by:** Issue #1 ✓
- **Estimated time:** 1-2 hours
- **Dependencies:** @bookmark/types, @bookmark/utils
- **Acceptance criteria:**
  - [ ] `@bookmark/types` with Link, Feed, RssEntry, Config interfaces
  - [ ] `@bookmark/utils` with validation, formatting, helper functions
  - [ ] Both packages export via `index.ts`
  - [ ] All other packages can import successfully
  - [ ] `pnpm -r tsc --noEmit` passes
  - [ ] JSDoc comments on all public functions

---

#### Issue #3: Migrate Parsers Service
- **Type:** AFK
- **Blocked by:** Issue #2 ✓
- **Estimated time:** 2-3 hours
- **Dependencies:** @bookmark/parsers (depends on @bookmark/types, @bookmark/utils)
- **Acceptance criteria:**
  - [ ] `parseXbel(content: string): Link[]` function implemented
  - [ ] `parseMarkdown(content: string): Link[]` function implemented
  - [ ] `parseRssEntries(entries: RssEntry[]): Link[]` function implemented
  - [ ] Unit tests pass (compare to Phase 1 data)
  - [ ] Data integrity verified (output matches Phase 1)
  - [ ] `pnpm -r test` passes
  - [ ] `pnpm -r tsc --noEmit` passes

---

#### Issue #4: Migrate Core Services
- **Type:** AFK
- **Blocked by:** Issue #2 ✓
- **Estimated time:** 2-3 hours
- **Dependencies:** @bookmark/core (depends on @bookmark/types, @bookmark/utils)
- **Acceptance criteria:**
  - [ ] `merge(sources: Link[][]): Link[]` function implemented
  - [ ] `deduplicate(links: Link[]): Link[]` function implemented
  - [ ] Unit tests pass (compare to Phase 1 data)
  - [ ] Data integrity verified (output matches Phase 1)
  - [ ] `pnpm -r test` passes
  - [ ] `pnpm -r tsc --noEmit` passes

---

#### Issue #5: Feeds Configuration + Workflows + CLI
- **Type:** AFK
- **Blocked by:** Issue #3, Issue #4 ✓
- **Estimated time:** 3-4 hours
- **Dependencies:** @bookmark/cli (orchestrates parsers + core)
- **Acceptance criteria:**
  - [ ] `feeds.json` created with schema (per-feed maxEntries, per-author max, schedule, sources)
  - [ ] `feeds.json` validated with sample data (3+ authors, multiple feeds)
  - [ ] GitHub workflows updated to read `feeds.json` dynamically
  - [ ] Workflows generate `rss-entries.json` with enforced limits
  - [ ] `@bookmark/cli` exports `generate()` function
  - [ ] CLI reads bookmarks.xbel, tabs.xbel, rss-entries.json
  - [ ] CLI outputs data.json
  - [ ] Local test: `pnpm cli` produces valid data.json
  - [ ] GitHub Actions workflow runs successfully
  - [ ] `data.json` quality matches/exceeds Phase 1

---

#### Issue #6: Migrate Web App to TypeScript
- **Type:** AFK
- **Blocked by:** Issue #5 ✓
- **Estimated time:** 2-3 hours
- **Dependencies:** web/ (imports @bookmark/hooks, @bookmark/utils, @bookmark/types)
- **Acceptance criteria:**
  - [ ] All `.jsx` files converted to `.tsx`
  - [ ] `web/src/App.tsx` correctly imports from `@bookmark/hooks`
  - [ ] `@bookmark/hooks` exports `useSearch` hook (TypeScript)
  - [ ] Web components properly typed
  - [ ] Search functionality identical to Phase 1 (no regression)
  - [ ] `npm run build` succeeds with zero errors
  - [ ] GitHub Pages deployment successful
  - [ ] https://abhishekgowda28.github.io/bookmark/ works
  - [ ] Data.json loads, search functional
  - [ ] Browser console has no errors

---

#### Issue #7: Linting, Prettier, and Documentation
- **Type:** AFK
- **Blocked by:** Issue #6 ✓
- **Estimated time:** 1-2 hours
- **Dependencies:** Entire workspace (final polish)
- **Acceptance criteria:**
  - [ ] `.eslintrc.json` created at repo root
  - [ ] `.prettierrc.json` created at repo root
  - [ ] `pnpm lint` runs across all packages
  - [ ] `pnpm format` runs and formats all files
  - [ ] `docs/ARCHITECTURE.md` created (workspace structure + adding packages)
  - [ ] `docs/DEVELOPMENT.md` created (local setup, CLI, workflows)
  - [ ] All public functions have JSDoc comments (@param, @returns)
  - [ ] Root `README.md` updated with workspace overview
  - [ ] Dead code removed (old Phase 1 JS if not needed)
  - [ ] `pnpm lint` passes with zero errors
  - [ ] `pnpm format --check` passes

---

### ⏳ IN PROGRESS

(None - ready to start execution)

---

### 🚫 BLOCKED

(None - all unblocked)

---

### ✅ COMPLETED

(None - refactor not started yet)

---

## Execution Timeline

```
Issue #1 (30 min)
    ↓
Issue #2 (1-2 hrs) + Issue #3 (2-3 hrs) + Issue #4 (2-3 hrs) [parallel after #2]
    ↓
Issue #5 (3-4 hrs)
    ↓
Issue #6 (2-3 hrs)
    ↓
Issue #7 (1-2 hrs)
    ↓
✅ MERGE refactor/monorepo → main
```

**Total: ~14-18 hours (can be spread over multiple days)**

---

## How to Use This Board

1. **When starting Issue #N:**
   - Move from "NOT STARTED" → "IN PROGRESS"
   - Update timestamp (e.g., "Started: 2025-05-10 14:00")
   - Check off acceptance criteria as you complete them

2. **If blocked:**
   - Move to "BLOCKED" section with reason
   - Note what unblocks it

3. **When complete:**
   - Move to "COMPLETED"
   - Mark all acceptance criteria ✅
   - Update timestamp

4. **After all 7 done:**
   - Create final commit on `refactor/monorepo`
   - Open PR to `main` for review
   - Merge after verification

---

## Key Notes

- ✅ All 7 issues are **AFK (Autonomous Fully-Kickoff)**
- ✅ Dependencies are sequential but clear
- ✅ Each issue is independently verifiable
- ✅ Phase 1 stays live on `main` branch (we're on `refactor/monorepo`)
- ✅ Plan is locked; focus is execution

---

## Next Step

**Ready to begin Issue #1: Initialize pnpm Workspace?**

When you confirm, I will:
1. Create `pnpm-workspace.yaml`
2. Create base `tsconfig.json`
3. Create all 6 package folders + `package.json` files
4. Run `pnpm install && pnpm -r tsc --noEmit` to verify

Proceed? 🚀
