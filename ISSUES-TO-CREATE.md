# Architectural Deepening Issues - Ready for Creation

**Total Issues**: 9  
**Breakdown**: 3 HIGH (Phase A) + 3 MEDIUM (Phase B) + 3 LOW (Phase C)  
**Total Estimated Effort**: 20-24 hours (if done sequentially) or 8-12 hours (if done in parallel)

---

## KANBAN OVERVIEW

### 🟥 PHASE A: Type System Safety (HIGH PRIORITY)
**Timeline**: Foundational, blocks Phase B  
**Effort**: 11-15 hours total

| # | Issue | Type | Status | Blockers |
|---|-------|------|--------|----------|
| 1 | PHASE A.1: Validation Seam Layer | AFK | Ready | None |
| 2 | PHASE A.2: Format Parser Abstraction Enhancement | AFK | Ready | None |
| 3 | PHASE A.3: Link Type Discriminator Refinement | AFK | Ready | #1 |

### 🟨 PHASE B: Extensibility (MEDIUM PRIORITY)  
**Timeline**: Follows Phase A  
**Effort**: 7-9 hours total

| # | Issue | Type | Status | Blockers |
|---|-------|------|--------|----------|
| 4 | PHASE B.1: Export AggregationData as Public API | AFK | Ready | None |
| 5 | PHASE B.2: Search Abstraction Boundary | AFK | Ready | None |
| 6 | PHASE B.3: Pipeline Step Repository (Documentation) | HITL | Ready | #4 |

### 🟩 PHASE C: Polish (LOW PRIORITY)
**Timeline**: Independent polish work  
**Effort**: 5-6 hours total

| # | Issue | Type | Status | Blockers |
|---|-------|------|--------|----------|
| 7 | PHASE C.1: Configurable Search Options | AFK | Ready | #5 |
| 8 | PHASE C.2: Config Validation Pipeline Step | AFK | Ready | #1 |
| 9 | PHASE C.3: Cleanup: Remove Hook Package Duplication | AFK | Ready | None |

---

## DETAILED ISSUES

### Issue 1: PHASE A.1 - Validation Seam Layer
**Type**: AFK | **Priority**: HIGH | **Effort**: 3-4 hrs  
**Labels**: `phase-a`, `high-priority`, `architecture`

**What to build**

Consolidate validation logic scattered across `@bookmark/schema` (Zod schemas) and `@bookmark/utils` (type guards) into a single unified `@bookmark/validation` package. This becomes the source of truth for all data validation decisions.

Create three main exports:
1. **Type guards** - lightweight runtime type narrowing functions
2. **Zod schemas** - comprehensive validation with structured error messages
3. **Registry pattern** - extensible system for registering new types and their validators

All consumers (parsers, CLI, core) import validation from one place, following one convention.

**Acceptance criteria**

- [ ] New `@bookmark/validation` package created and exported from workspace
- [ ] All validation logic from `@bookmark/utils` and `@bookmark/schema` consolidated
- [ ] Type guards and Zod schemas coexist in single package with clear API
- [ ] All consumers updated to import from `@bookmark/validation`
- [ ] Existing tests pass; validation tests extended for registry pattern
- [ ] Package exports documented: when to use type guards vs schemas
- [ ] No breaking changes to public API contracts

**Blocked by**: None — can start immediately

---

### Issue 2: PHASE A.2 - Format Parser Abstraction Enhancement
**Type**: AFK | **Priority**: HIGH | **Effort**: 4-6 hrs  
**Labels**: `phase-a`, `high-priority`, `parser`

**What to build**

Convert the three separate parser functions (`parseXbel`, `parseMarkdown`, `parseRssEntries`) into a unified Parser interface with a registry pattern. New formats can be added without modifying CLI orchestration code.

Define Parser interface with:
- `name: string` - human-readable format name
- `canParse(source: unknown): boolean` - capability check
- `parse(source: unknown): Promise<ParseResult<Link[]>>` - async parsing with error reporting

Implement concrete parsers: `XbelParser`, `MarkdownParser`, `RssParser` as classes. Registry provides add/list/lookup operations. CLI iterates registry instead of calling functions by name.

Make all async for consistency. ParseResult separates successful links from processing errors, improving visibility into dropped entries.

**Acceptance criteria**

- [ ] Parser interface defined and documented
- [ ] ParserRegistry class created with add/list/lookup methods
- [ ] Three existing parsers migrated to Parser classes (XbelParser, MarkdownParser, RssParser)
- [ ] ParseResult type captures both success data and error details
- [ ] CLI updated to use registry instead of direct function calls
- [ ] All parser tests updated and passing
- [ ] New parser registration is zero-CLI-change process (add Parser class, register)
- [ ] Error handling and visibility improved: can trace which entries failed and why

**Blocked by**: None — can start immediately

---

### Issue 3: PHASE A.3 - Link Type Discriminator Refinement
**Type**: AFK | **Priority**: HIGH | **Effort**: 3-4 hrs  
**Labels**: `phase-a`, `high-priority`, `types`

**What to build**

Use TypeScript discriminated unions to encode field validity per Link source type. This prevents invalid Link combinations at compile time (e.g., BookmarkLink cannot have `feed` field).

Refactor Link interface into:
- `BookmarkLink` - source: 'bookmark', no feed field
- `RssLink` - source: 'rss', feed field required
- `Link = BookmarkLink | RssLink` - union type

Add extensible metadata object for Phase 2 features (timestamps, tags, read status, notes):
```typescript
metadata?: {
  addedAt?: string;      // ISO 8601
  tags?: string[];
  read?: boolean;
  notes?: string;
}
```

Update all consumers to use discriminated union type guards.

**Acceptance criteria**

- [ ] BookmarkLink and RssLink types defined in @bookmark/types
- [ ] Link exported as discriminated union (BookmarkLink | RssLink)
- [ ] Type guards created for both variants (isBookmarkLink, isRssLink)
- [ ] Metadata object added to both Link variants
- [ ] All parsers updated to create properly typed links
- [ ] Schema validation updated for discriminated union
- [ ] All consumers (web, CLI, search) updated to use type guards
- [ ] Tests verify that invalid combinations are rejected by TypeScript
- [ ] No runtime errors for field access based on source

**Blocked by**: #1 (PHASE A.1 - Validation Seam Layer)

---

### Issue 4: PHASE B.1 - Export AggregationData as Public API
**Type**: AFK | **Priority**: MEDIUM | **Effort**: 2-3 hrs  
**Labels**: `phase-b`, `medium-priority`, `documentation`

**What to build**

Make `AggregationData` (currently internal state for accumulating links across pipeline steps) a documented public API. This enables external code to write compatible pipeline steps.

Export AggregationData from `@bookmark/core` with comprehensive JSDoc describing:
- Each field's purpose and lifecycle
- What steps depend on which fields (step ordering dependencies)
- Type guarantees for each field
- How to safely read/write fields

Add helper methods: `getLinks()`, `getConfig()`, `getProjectRoot()` for safe field access.

Document step contract: expected state before step, mutations during step, guarantees after step.

**Acceptance criteria**

- [ ] AggregationData interface exported from @bookmark/core
- [ ] JSDoc documents each field: purpose, type, when available
- [ ] Step ordering dependencies documented (e.g., LoadConfigStep must run before ValidateConfigStep)
- [ ] Helper getter methods added for safe field access
- [ ] Step contract pattern documented with examples
- [ ] All existing steps follow documented contract
- [ ] External developers can write compatible steps using interface

**Blocked by**: None — can start immediately

---

### Issue 5: PHASE B.2 - Search Abstraction Boundary
**Type**: AFK | **Priority**: MEDIUM | **Effort**: 2-3 hrs  
**Labels**: `phase-b`, `medium-priority`, `search`

**What to build**

Enforce true abstraction boundary for search engine. Currently Fuse.js implementation details leak (type alias `type Searcher = Fuse<Link>`, direct API access via `getIndex().docs`). This makes it impossible to swap search algorithms.

Create opaque Searcher type. Export SearchOptions interface:
```typescript
interface SearchOptions {
  threshold?: number;        // 0-1, default 0.3
  weights?: Record<string, number>;  // field weights, default {title: 2, url: 1}
  limit?: number;            // max results, default unlimited
  minMatchCharLength?: number; // default 1
}
```

Functions become:
- `createSearcher(links: Link[], options?: SearchOptions): Searcher`
- `search(searcher: Searcher, query: string, options?: SearchOptions): Link[]`

Remove direct Fuse.js API access (no `getIndex()` exports). Package absorbs all implementation details.

**Acceptance criteria**

- [ ] Searcher type is opaque (not exposed as `Fuse<Link>`)
- [ ] SearchOptions interface defined with all tunable parameters
- [ ] createSearcher accepts options parameter
- [ ] search function accepts per-query options parameter
- [ ] No direct Fuse.js API exposed in package exports
- [ ] All consumers updated to use new interface
- [ ] Tests verify Fuse.js internals are inaccessible from outside package
- [ ] Search algorithm could be swapped with zero consumer changes

**Blocked by**: None — can start immediately

---

### Issue 6: PHASE B.3 - Pipeline Step Repository (Documentation)
**Type**: HITL (review) | **Priority**: MEDIUM | **Effort**: 2-3 hrs  
**Labels**: `phase-b`, `medium-priority`, `documentation`

**What to build**

Create comprehensive guide for external developers writing pipeline steps compatible with the aggregation pipeline. Document:

1. **Step contract**: input state, output state, error handling expectations
2. **AggregationData API**: which fields to read, which to write, ordering constraints
3. **Pattern examples**: LoadStep pattern, TransformStep pattern, ValidateStep pattern
4. **Error handling**: how to report errors (throw, return, log)
5. **Testing pattern**: how to unit test steps in isolation
6. **Registration**: how to add custom steps to CLI

Document in `/docs/STEP-DEVELOPMENT-GUIDE.md` with:
- Step interface definition
- 3-4 worked examples (LoadConfigStep, ValidateStep, TransformStep, OutputStep)
- Common mistakes and troubleshooting
- When to write a custom step vs modifying existing ones

**Acceptance criteria**

- [ ] STEP-DEVELOPMENT-GUIDE.md created and comprehensive
- [ ] Step lifecycle documented (construction, execution, error handling)
- [ ] AggregationData API reference included
- [ ] 3+ worked examples showing different step patterns
- [ ] Testing strategy documented with example
- [ ] Common pitfalls and solutions documented
- [ ] Guide reviewed for clarity and completeness

**Blocked by**: #4 (PHASE B.1 - Export AggregationData as Public API)

---

### Issue 7: PHASE C.1 - Configurable Search Options
**Type**: AFK | **Priority**: LOW | **Effort**: 2-3 hrs  
**Labels**: `phase-c`, `low-priority`, `search`

**What to build**

Expose runtime configuration for search behavior. Currently threshold (0.3) and field weights are hardcoded. Allow customization per-call and per-hook.

Update `useSearch` hook to accept SearchOptions:
```typescript
const { results } = useSearch(links, query, {
  threshold: 0.5,
  weights: { title: 3, url: 1 },
  limit: 50
});
```

Web app settings could store user preference for strictness, passed to hook on mount.

CLI could accept `--search-threshold` and `--field-weights` flags for batch operations.

**Acceptance criteria**

- [ ] useSearch hook accepts SearchOptions parameter
- [ ] Web app SearchableList accepts onSearchOptions callback
- [ ] User preference stored in localStorage (future UI setting)
- [ ] Search options propagated through component tree
- [ ] Tests verify different threshold values change result ranking
- [ ] Performance: no regression when changing options

**Blocked by**: #5 (PHASE B.2 - Search Abstraction Boundary)

---

### Issue 8: PHASE C.2 - Config Validation Pipeline Step
**Type**: AFK | **Priority**: LOW | **Effort**: 2-3 hrs  
**Labels**: `phase-c`, `low-priority`, `validation`

**What to build**

Make configuration validation a first-class pipeline step instead of hidden inside `loadConfig()`. This makes validation errors visible as pipeline outputs and allows independent validation (e.g., GitHub Actions pre-check).

Create `ValidateConfigStep` implementing Step interface:
- Input: projectRoot (string)
- Output: ValidatedConfig (config + validation report)
- Error: ValidationError with detailed messages per rule

Add to CLI pipeline between LoadConfig and other steps. Makes validation errors part of aggregation report.

Could run ValidateConfigStep separately in GitHub Actions workflow before main aggregation.

**Acceptance criteria**

- [ ] ValidateConfigStep created and implements Step interface
- [ ] Takes projectRoot, returns ValidatedConfig + report
- [ ] Detailed validation errors reported per feeds.json rule
- [ ] Step integrated into CLI pipeline
- [ ] Validation can run standalone (e.g., GitHub Actions pre-check)
- [ ] All existing validation rules still enforced
- [ ] Step tests cover valid/invalid config scenarios

**Blocked by**: #1 (PHASE A.1 - Validation Seam Layer)

---

### Issue 9: PHASE C.3 - Cleanup: Remove Hook Package Duplication
**Type**: AFK | **Priority**: LOW | **Effort**: 1 hr  
**Labels**: `phase-c`, `low-priority`, `cleanup`

**What to build**

Remove the false export `@bookmark/hooks`. Currently the package is published but web app doesn't use it — instead has its own duplicate copy of `useSearch` hook at `@bookmark/web/src/hooks/useSearch.ts`.

Decision: Hooks are React-specific UI concerns, should live with UI code, not in monorepo packages.

Action:
1. Delete `/packages/hooks` directory
2. Update `package.json` workspace to remove @bookmark/hooks
3. Update TypeScript paths if applicable
4. Verify web app already has its own `useSearch.ts` (no changes needed there)

**Acceptance criteria**

- [ ] @bookmark/hooks package deleted
- [ ] package.json workspace entries updated
- [ ] No remaining imports of @bookmark/hooks in any package
- [ ] Web app continues to work with its local useSearch.ts
- [ ] All tests pass
- [ ] pnpm ls shows hooks package removed

**Blocked by**: None — can start immediately

---

## CREATION INSTRUCTIONS

### Using GitHub CLI (Recommended)

If you have `gh` authenticated, run:
```bash
gh auth login  # If needed
# Then use gh issue create with this repo
```

### Manual Creation via Web UI

For each issue:
1. Go to https://github.com/AbhishekGowda28/bookmark/issues/new
2. Use the **Title** and **What to build** sections from above
3. Paste the **Acceptance criteria** as a checklist
4. Add labels from the **Labels** section
5. Reference blocking issues in the description

### Recommended Creation Order

To maximize parallel work:

**Batch 1** (Create these first):
- #1: PHASE A.1 - Validation Seam Layer
- #2: PHASE A.2 - Format Parser Abstraction Enhancement
- #4: PHASE B.1 - Export AggregationData as Public API
- #5: PHASE B.2 - Search Abstraction Boundary
- #9: PHASE C.3 - Cleanup: Remove Hook Package Duplication

**Batch 2** (After Batch 1):
- #3: PHASE A.3 - Link Type Discriminator Refinement (blocks on #1)
- #6: PHASE B.3 - Pipeline Step Repository (blocks on #4)
- #8: PHASE C.2 - Config Validation Pipeline Step (blocks on #1)

**Batch 3** (After B2.2 work):
- #7: PHASE C.1 - Configurable Search Options (blocks on #5)

---

## EXECUTION STRATEGIES

### Strategy A: Parallel Execution (Recommended)
**Timeline**: ~10-14 hours (parallel within dependencies)

Work on Batch 1 issues in parallel:
- Dev 1: Issue #1 + #3 (validation layer + discriminator)
- Dev 2: Issue #2 (parser abstraction)
- Dev 3: Issue #4 + #6 (aggregation data + docs)
- Dev 4: Issue #5 + #7 (search abstraction + options)
- Dev 5: Issue #9 (cleanup)

### Strategy B: Sequential (Safe)
**Timeline**: ~22-28 hours

Work through phases in order: A → B → C

### Strategy C: Hybrid (Balanced)
**Timeline**: ~14-18 hours

- Complete Phase A sequentially (blocks everything)
- Parallelize Phase B & C once A is done

---

## DEPENDENCIES VISUALIZATION

```
Phase A (Blocks Phase B):
  #1 ◄──┐
         ├── #3
  #2 ◄──┘

Phase B (Independent from A after foundation):
  #4 ◄─── #6
  #5 ◄─── #7

Phase C (Polish, can start anytime):
  #1 ◄─── #8
  #9 (independent)

Overall DAG:
  #1 ──→ #3 ──→ (Phase B work)
  #1 ──→ #8
  #2 (independent)
  #4 ──→ #6 ──→ (Phase C docs)
  #5 ──→ #7
  #9 (independent)
```

---

## NOTES FOR TEAM

1. **Phase A is foundational** — contains all breaking changes to types and validation. Complete before Phase B.
2. **Phase B enables extensibility** — external developers can write custom steps/parsers once these land.
3. **Phase C is polish** — can run in parallel with Phase A/B, doesn't block other work.
4. **HITL Issues** (#6) require review/approval before merge. Others (AFK) can be merged without human review.
5. **Test Coverage** — each issue includes comprehensive acceptance criteria; treat these as mandatory.
6. **No Regressions** — all existing tests must pass. New tests may be required for new functionality.

---

**Created**: 2026-05-10  
**Total Issues**: 9  
**Ready to Create**: ✅ Yes
