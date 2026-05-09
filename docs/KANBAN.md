# Phase 1 Kanban Board: Link Retrieval System

**Status:** Ready for Development  
**Last Updated:** May 9, 2026  
**Total Slices:** 11 (Revised - All Vertical)  
**Dependencies:** Sequential with parallelization opportunities

---

## Kanban Columns: TODO → IN PROGRESS → BLOCKED → DONE

---

## TODO (Backlog)

### Slice 1a: Node.js Parser Project Setup
- **Type:** AFK  
- **Blocked by:** None - can start immediately  
- **User stories:** N/A (infrastructure - enables all parser work)  
- **Priority:** P0  
- **Story Points:** 2

**What to build:**
Initialize scripts/ project with package.json (xml2js, better-sqlite3, markdown parser), .gitignore, and verify npm install works. Creates independent foundation for all parser slices to build on.

**Acceptance criteria:**
- [ ] scripts/ folder created
- [ ] scripts/package.json with xml2js, better-sqlite3, markdown parser dependencies
- [ ] scripts/.gitignore created (node_modules, .env, etc.)
- [ ] npm install in scripts/ succeeds without errors
- [ ] scripts/parse-links.js skeleton file created (ready for implementation)

---

### Slice 2: Parse Bookmarks & Tabs
- **Type:** AFK  
- **Blocked by:** Slice 1a  
- **User stories:** Use Case 1 (Quick Link Search), Use Case 3 (Source Context)  
- **Priority:** P0  
- **Story Points:** 5

**What to build:**
Implement XBEL parser in scripts/parse-links.js to extract all bookmarks from bookmarks.xbel and tabs from tabs.xbel. Output combined list with title, URL, source="bookmark" for 3000+ bookmarks + ~20 tabs. Parser handles nested folder structures and extracts href attributes correctly.

**Acceptance criteria:**
- [ ] XBEL parser successfully reads bookmarks.xbel and tabs.xbel
- [ ] All 3000+ bookmarks extracted with title and URL intact
- [ ] All ~20 tabs extracted with title and URL intact
- [ ] Source field set to "bookmark" for all entries
- [ ] Handles nested folders (extracts from any depth)
- [ ] Parser completes in < 2 seconds
- [ ] No parsing errors logged
- [ ] Sample output JSON verified for correctness

---

### Slice 3: Parse RSS Feeds
- **Type:** AFK  
- **Blocked by:** Slice 1a  
- **User stories:** Use Case 1 (Quick Link Search), Use Case 2 (Link Rediscovery)  
- **Priority:** P0  
- **Story Points:** 4

**What to build:**
Implement markdown parser in scripts/parse-links.js to extract RSS entries from README.md sections (using <!-- FEEDNAME:START --> and <!-- FEEDNAME:END --> markers). Extract title, URL, and feed name for ~50 RSS entries with source="rss".

**Acceptance criteria:**
- [ ] Markdown parser correctly identifies RSS sections using <!-- markers -->
- [ ] Extracts all 50+ RSS entries from README.md
- [ ] Each entry has title, URL, feed_name, and source="rss"
- [ ] Feed names preserved (e.g., "Paul Graham", "TotalTypescript")
- [ ] Parser handles markdown link format: `- [Title](URL)`
- [ ] Parser completes in < 1 second
- [ ] Sample output JSON verified for correctness

---

### Slice 5: Set Up SQLite for RSS History
- **Type:** AFK  
- **Blocked by:** Slice 1a  
- **User stories:** N/A (future-proofing for Phase 2 metadata)  
- **Priority:** P1  
- **Story Points:** 3

**What to build:**
Initialize links.db with SQLite schema. Set up database connection, create table schema (id, title, url, feed_name, added_at), and implement append-only logic for storing RSS entries. For Phase 1, this is setup only; actual appending happens in Slice 4.

**Acceptance criteria:**
- [ ] links.db file created successfully
- [ ] SQLite schema includes: id (PRIMARY KEY), title, url (UNIQUE), feed_name, added_at (TIMESTAMP)
- [ ] Database connection established without errors
- [ ] Append-only logic implemented (INSERT OR IGNORE for duplicates)
- [ ] Test insert of sample RSS entry succeeds
- [ ] Verify entry persists in database after restart

---

### Slice 4: Merge, Deduplicate & Output JSON
- **Type:** AFK  
- **Blocked by:** Slice 2, Slice 3, Slice 5  
- **User stories:** All use cases  
- **Priority:** P0  
- **Story Points:** 4

**What to build:**
Combine bookmarks + tabs + RSS into single list. Deduplicate on URL (if same link appears in multiple sources, keep one with source badge). Output final data.json to web/public/data.json. Append new RSS entries to links.db. Final output: ~3070 aggregated links.

**Acceptance criteria:**
- [ ] All three sources merged into single array
- [ ] Duplicates identified by URL match and removed
- [ ] Final list includes bookmarks + tabs + RSS (~3070 entries)
- [ ] data.json output has correct schema: id, title, url, source, (feed for RSS)
- [ ] data.json is valid JSON (parseable)
- [ ] New RSS entries appended to links.db
- [ ] Performance: entire process completes in < 5 seconds

---

### Slice 6 (REVISED): React App Shell + Setup
- **Type:** AFK  
- **Blocked by:** Slice 1a, Slice 4  
- **User stories:** All use cases  
- **Priority:** P0  
- **Story Points:** 5

**What to build:**
Set up React project with Vite scaffolding (package.json with react, react-dom, fuse.js, vite.config.js, folder structure). Create App.jsx that loads data.json on mount, handles loading/error states, and renders initial list of all links. This is end-to-end: infrastructure → feature → working browser result.

**Acceptance criteria:**
- [ ] web/ scaffolded with Vite + React
- [ ] web/package.json has react, react-dom, fuse.js dependencies
- [ ] web/vite.config.js configured for React
- [ ] web/.gitignore created
- [ ] npm install in web/ succeeds
- [ ] npm run dev starts dev server successfully
- [ ] npm run build creates dist/ without errors
- [ ] App.jsx loads data.json via fetch()
- [ ] Loading state displays during fetch
- [ ] Error state handles failures gracefully
- [ ] All ~3070 links render in DOM
- [ ] Page loads in < 2 seconds
- [ ] No JavaScript errors in browser console

---

### Slice 7: Build Search UI & Fuse.js Integration
- **Type:** AFK  
- **Blocked by:** Slice 6  
- **User stories:** Use Case 1 (Quick Link Search), Use Case 2 (Link Rediscovery)  
- **Priority:** P0  
- **Story Points:** 5

**What to build:**
Create SearchableList.jsx component with search input field. Implement useSearch.js hook that initializes Fuse.js with fuzzy search configuration (fields: title + url, threshold: 0.3). Wire up real-time search: user types → Fuse.js filters → results display.

**Acceptance criteria:**
- [ ] SearchableList.jsx renders input field with placeholder "Search..."
- [ ] useSearch.js hook initializes Fuse.js correctly
- [ ] Real-time search fires on input change
- [ ] Search results update instantly (< 100ms)
- [ ] Fuzzy search works: "pual" matches "paul"
- [ ] Partial matches work: "kub" matches "kubernetes"
- [ ] Empty search returns all links
- [ ] "No results" message displays when search yields nothing
- [ ] Search handles 3000+ items without lag

---

### Slice 8: Implement Link Display & Styling
- **Type:** AFK  
- **Blocked by:** Slice 7  
- **User stories:** Use Case 3 (Source Context)  
- **Priority:** P0  
- **Story Points:** 3

**What to build:**
Render search results list. Each result displays: title (clickable link) + full URL + source badge (showing "bookmark" or "rss: Feed Name"). Implement click handler so links open in new tab. Create App.css with minimalist styling (clean typography, subtle colors, responsive layout).

**Acceptance criteria:**
- [ ] Each result renders as: [Title as Link] | URL | [Source Badge]
- [ ] Clicking title/link opens URL in new tab (target="_blank")
- [ ] Source badge correctly shows "bookmark" for bookmarks
- [ ] Source badge correctly shows "rss: Feed Name" for RSS entries
- [ ] App.css provides minimal, clean styling
- [ ] Typography is readable (font size, line height, color contrast)
- [ ] Layout is responsive (works on mobile + desktop)
- [ ] No visual clutter or heavy styling
- [ ] Link state (hover) is visually distinct

---

### Slice 9: GitHub Actions Parser Workflow
- **Type:** AFK  
- **Blocked by:** Slice 4  
- **User stories:** N/A (automation)  
- **Priority:** P1  
- **Story Points:** 3

**What to build:**
Create .github/workflows/parse-links.yml. Triggers: daily schedule (0 2 * * * = 2 AM UTC) + manual dispatch. Steps: checkout repo → setup Node.js → install dependencies → run scripts/parse-links.js → commit updated data.json and links.db → push to main.

**Acceptance criteria:**
- [ ] Workflow file created at .github/workflows/parse-links.yml
- [ ] Daily schedule trigger configured (0 2 * * *)
- [ ] Manual dispatch trigger configured
- [ ] Workflow checks out repo
- [ ] Workflow installs Node.js and dependencies
- [ ] Workflow executes parse-links.js successfully
- [ ] Workflow commits data.json if changed
- [ ] Workflow commits links.db if changed
- [ ] Workflow pushes changes to main
- [ ] Manual trigger works from GitHub Actions tab

---

### Slice 10: GitHub Actions Deploy Workflow
- **Type:** AFK  
- **Blocked by:** Slice 8, Slice 9  
- **User stories:** N/A (deployment)  
- **Priority:** P0  
- **Story Points:** 3

**What to build:**
Create .github/workflows/deploy.yml. Triggers: manual dispatch + on push to main. Steps: checkout repo → setup Node.js → install web dependencies → build React app (npm run build in web/) → deploy dist/ folder to gh-pages branch.

**Acceptance criteria:**
- [ ] Workflow file created at .github/workflows/deploy.yml
- [ ] Manual dispatch trigger configured
- [ ] Triggers on push to main branch
- [ ] Workflow checks out repo
- [ ] Workflow installs Node.js
- [ ] Workflow installs web dependencies
- [ ] Workflow builds React app (vite build)
- [ ] Build produces dist/ folder with static files
- [ ] Workflow deploys dist/ to gh-pages branch
- [ ] Build completes without errors

---

### Slice 11: GitHub Pages Configuration & End-to-End Validation
- **Type:** HITL  
- **Blocked by:** Slice 10  
- **User stories:** All use cases  
- **Priority:** P0  
- **Story Points:** 2

**What to build:**
Enable GitHub Pages in repo settings, configure to deploy from gh-pages branch. Verify site is live at https://abhishekgowda.github.io/bookmark/. Complete full validation: trigger parser manually → verify data.json updates → trigger deploy → verify live site updates → test search functionality → verify links clickable → confirm all PRD acceptance criteria met.

**Acceptance criteria:**
- [ ] GitHub Pages enabled in repo settings
- [ ] Deploy source set to gh-pages branch
- [ ] Site is live at https://abhishekgowda.github.io/bookmark/
- [ ] Manual parser trigger executes successfully
- [ ] data.json updated with latest entries
- [ ] Manual deploy trigger succeeds
- [ ] Live site updates after deploy
- [ ] Search for "kubernetes" returns expected results
- [ ] Search for "paul" returns Paul Graham feed entries
- [ ] Search for "ai" returns AI-related articles
- [ ] Clicking a link opens it in new tab
- [ ] Source badges display correctly
- [ ] Load time < 2 seconds
- [ ] Search response time < 100ms
- [ ] No JavaScript errors in browser console
- [ ] All PRD acceptance criteria checklist 100% complete

---

## IN PROGRESS

(No slices started yet)

---

## BLOCKED

(No slices blocked)

---

## DONE

(No slices completed yet)

---

## Parallelization Opportunities

**Can start immediately after Slice 1a (all blocked only by 1a):**
- Slice 2 (Parse Bookmarks & Tabs)
- Slice 3 (Parse RSS Feeds)
- Slice 5 (SQLite Setup)

**Critical path (sequential):**
```
Slice 1a ─────────────┬─→ Slice 2 ─┐
                      ├─→ Slice 3 ─┤
                      └─→ Slice 5 ─┤
                                   └─→ Slice 4 ─→ Slice 6 ─→ Slice 7 ─→ Slice 8 ─┬─→ Slice 10 ─→ Slice 11
                                                                                    └─→ Slice 9 ──┘
```

**Parallelization:**
- Slices 2, 3, 5 run simultaneously (all blocked by 1a only)
- Slices 9, 10 can start in parallel (independent workflows)

**Estimated Timeline:**
- **Week 1:** Slices 1a → 2/3/5 (parallel) → 4 → 6 → 7 → 8 (core features)
- **Week 2:** Slices 9/10 (parallel) → 11 (automation + deployment + validation)

---

## How to Use This Kanban Board

1. **Pick a slice from TODO** (respecting dependencies shown above)
2. **Move to IN PROGRESS** when starting work
3. **Update acceptance criteria** as you complete each item (check boxes)
4. **Move to BLOCKED** if you hit a dependency issue
5. **Move to DONE** when all acceptance criteria are checked ✅
6. **Document:** This is your single source of truth for Phase 1 work

---

## Document Relationships

- **PHASE-1-PRD.md** - WHAT to build (user-facing behavior, success metrics)
- **PHASE-1-DESIGN.md** - HOW to build it (technical architecture, file structure)
- **KANBAN.md** (this file) - EXECUTION plan (11 vertical slices, dependencies, tracking)

---

## Document History

| Date | Author | Change |
|------|--------|--------|
| 2026-05-09 | Abhishek Gowda | Initial 12-slice kanban board |
| 2026-05-09 | Abhishek Gowda | Revised to 11 vertical slices (merged React setup into Slice 6) |
