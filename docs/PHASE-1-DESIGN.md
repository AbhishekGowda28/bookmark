# Phase 1 Design Document: Link Retrieval System

**Date Created:** May 9, 2026  
**Status:** Design Complete - Ready for Implementation  
**Owner:** Abhishek Gowda

---

## Problem Statement

You have links scattered across multiple sources:
1. **Bookmarks** - Collected via Flocuss bookmark manager (bookmarks.xbel)
2. **Open Tabs** - Browser tabs synced via Flocuss (tabs.xbel)
3. **RSS Feeds** - Auto-populated in README.md via gautamkrishkar/blog-post-workflow

**Goal:** Build a single, searchable interface to quickly find and retrieve these links without jumping between Flocuss, browser history, and README.md.

**MVP Scope:** Searchable list aggregating all three sources with title, URL, and source context.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Data Sources                                │
│  bookmarks.xbel    tabs.xbel    README.md (RSS feeds)          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              Node.js Parser Script                              │
│  (scripts/parse-links.js)                                       │
│  - Parse XBEL files (XML)                                       │
│  - Parse README.md RSS sections                                 │
│  - Deduplicate across sources                                   │
│  - Output: web/public/data.json                                 │
│  - Populate: SQLite (links.db) with RSS entries                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              Static JSON + SQLite                               │
│  web/public/data.json (searchable list)                         │
│  links.db (RSS history, append-only)                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              React Web App                                       │
│  (web/)                                                          │
│  - Load data.json on startup                                    │
│  - Fuse.js fuzzy search (client-side)                           │
│  - Display: title (clickable) + URL + source badge             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              GitHub Pages                                        │
│  https://abhishekgowda.github.io/bookmark/                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Design Decisions - All 20 Questions Locked

### Q1: Primary Problem
**Decision:** Build a single, searchable interface to retrieve bookmarks/RSS links without context switching.

### Q2: Phasing Strategy
**Decision:** Build ONE output at a time (web → API → mobile), not all simultaneously.

### Q3: First Output
**Decision:** Build **web app first**, then REST API, then mobile app.

### Q4: MVP Core Features
**Decision:** Searchable list only. No categorization, filtering, or tagging in Phase 1.
- Aggregated links from bookmarks + RSS
- Search by title/URL

### Q5: Data Source Handling for RSS Growth
**Decision:** Option C - Keep RSS workflow untouched. Node script syncs README.md → SQLite locally.

### Q6: Data Normalization Layer
**Decision:** Node.js script (not frontend, not external service). Parses files → unified JSON.

### Q7: RSS Feed Storage
**Decision:** SQLite for append-only RSS log. README.md remains the canonical source for GitHub Actions.

### Q8: Metadata Tracking
**Decision:** Not needed for Phase 1. Reserved for Phase 2 (read/unread, timestamps, tags).

### Q9: Node Script Output Format
**Decision:** Simple structure (no metadata):
```json
[
  { "id": "uuid", "title": "...", "url": "...", "source": "bookmark" },
  { "id": "uuid", "title": "...", "url": "...", "source": "rss", "feed": "Paul Graham" }
]
```

### Q10: Search Implementation
**Decision:** Fuse.js (client-side fuzzy search). Instant, no backend latency, handles typos.

### Q11: Frontend Framework
**Decision:** React (scales for Phase 2 API + Phase 3 mobile).

### Q12: Data Delivery to Web App
**Decision:** Option C - Scheduled Node job outputs static JSON → React loads on startup.

### Q13: Web App Deployment
**Decision:** GitHub Pages (free, automatic, already in git).

### Q14: Project Structure
**Decision:** Monorepo:
```
/scripts/     → Node parser script
/web/         → React app
data.json     → Output (in web/public/)
links.db      → SQLite (in repo root)
```

### Q15: React Folder Structure
**Decision:** Standard layout:
- `App.jsx` (main container, loads data)
- `components/SearchableList.jsx` (search + results)
- `hooks/useSearch.js` (Fuse.js integration)
- `styles/App.css` (minimal)

### Q16: Folder Hierarchy Display
**Decision:** No folder context displayed in UI. Just title + URL + source badge.

### Q17: Data Refresh Frequency
**Decision:** Option D - Daily scheduled (e.g., 2 AM) + manual trigger available.

### Q18: UI Layout
**Decision:** Minimalist:
- Search box at top
- Results below (title as clickable link + URL + source badge)
- No cards, no heavy styling

### Q19: Folder Context in JSON
**Decision:** Omitted from final JSON output. Simplifies UI, can add later if needed.

### Q20: Complete Data Flow Validation
**Decision:** Confirmed. Full end-to-end flow understood and approved.

---

## Implementation Plan

### Phase 1: Foundation (Week 1)

#### Node.js Parser Script
- [ ] Create `/scripts` folder
- [ ] Create `scripts/package.json` with dependencies:
  - `xml2js` (parse .xbel)
  - `better-sqlite3` (SQLite management)
  - Markdown parsing library
- [ ] Write `scripts/parse-links.js`:
  - Parse bookmarks.xbel recursively
  - Parse tabs.xbel
  - Parse README.md RSS sections (using <!-- markers -->)
  - Deduplicate on URL
  - Output to `web/public/data.json`
  - Append RSS entries to `links.db`
- [ ] Test locally with sample data
- [ ] Create `.gitignore` for scripts

#### React Web App
- [ ] Create `/web` with Vite
- [ ] Setup dependencies: `react`, `react-dom`, `fuse.js`
- [ ] Create folder structure (src/components, src/hooks, src/styles)
- [ ] Implement **App.jsx**:
  - Fetch data.json on mount
  - Handle loading/error states
  - Pass data to SearchableList
- [ ] Implement **SearchableList.jsx**:
  - Search input (real-time)
  - Results list with title (clickable link) + URL + source badge
  - Empty state
- [ ] Implement **useSearch.js**:
  - Initialize Fuse.js with data
  - Return search/results function
- [ ] Implement **App.css** (minimal styling):
  - Clean typography
  - Subtle colors
  - Responsive layout
- [ ] Test locally (with sample data.json)

### Phase 2: Automation & Deployment (Week 2)

#### GitHub Actions Workflows
- [ ] Create `.github/workflows/parse-links.yml`:
  - Trigger: Daily schedule (0 2 * * *) + manual dispatch
  - Steps: Checkout → Setup Node → Install → Run parse-links.js → Commit changes → Push
- [ ] Create `.github/workflows/deploy.yml`:
  - Trigger: Manual dispatch + on push to main
  - Steps: Checkout → Setup Node → Install web deps → Build React (npm run build) → Deploy to gh-pages

#### Deployment Configuration
- [ ] Enable GitHub Pages in repo settings
- [ ] Configure to deploy from gh-pages branch
- [ ] Test manual parse workflow trigger
- [ ] Test manual deploy workflow trigger
- [ ] Verify site lives at GitHub Pages URL

#### Final Validation
- [ ] End-to-end test: Parse workflow → Deploy workflow → Site live
- [ ] Search functionality works (test: "kubernetes", "paul graham", "ai", etc.)
- [ ] Links are clickable
- [ ] Source badges display correctly
- [ ] Daily schedule is active

---

## File Structure (Complete)

```
bookmark/
├── bookmarks.xbel                 (existing - user data)
├── tabs.xbel                      (existing - user data)
├── README.md                      (existing - RSS + docs)
├── links.db                       (NEW - SQLite RSS log)
│
├── scripts/                       (NEW)
│   ├── parse-links.js            (NEW - main parser)
│   ├── package.json              (NEW)
│   └── .gitignore                (NEW)
│
├── web/                          (NEW - React app)
│   ├── public/
│   │   ├── index.html            (NEW)
│   │   └── data.json             (NEW - generated by parser)
│   ├── src/
│   │   ├── App.jsx               (NEW)
│   │   ├── index.jsx             (NEW)
│   │   ├── components/
│   │   │   └── SearchableList.jsx (NEW)
│   │   ├── hooks/
│   │   │   └── useSearch.js      (NEW)
│   │   └── styles/
│   │       └── App.css           (NEW)
│   ├── package.json              (NEW)
│   ├── vite.config.js            (NEW)
│   └── .gitignore                (NEW)
│
├── .github/workflows/
│   ├── parse-links.yml           (NEW)
│   ├── deploy.yml                (NEW)
│   └── (existing workflows)
│
└── docs/                         (NEW)
    └── PHASE-1-DESIGN.md         (this file)
```

---

## JSON Data Format (Final)

**Input Sources:**
- bookmarks.xbel: 3000+ nested bookmarks
- tabs.xbel: ~20 tabs
- README.md: ~50 RSS entries (across multiple feeds)

**Output Structure (web/public/data.json):**
```json
[
  {
    "id": "uuid-123",
    "title": "FY24 Q2 | Sticker DEX Merge to Studio 6 | Enabling the Experience for New Products",
    "url": "https://vistaprint.atlassian.net/wiki/spaces/QS/pages/3640918181/...",
    "source": "bookmark"
  },
  {
    "id": "uuid-456",
    "title": "Superlinear Returns",
    "url": "http://www.paulgraham.com/superlinear.html",
    "source": "rss",
    "feed": "Paul Graham"
  },
  {
    "id": "uuid-789",
    "title": "How To De-Slop A Codebase Ruined By AI (with one skill)",
    "url": "https://www.youtube.com/watch?v=3MP8D-mdheA",
    "source": "rss",
    "feed": "TotalTypescript"
  }
]
```

**SQLite Schema (links.db):**
```
CREATE TABLE IF NOT EXISTS rss_entries (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  feed_name TEXT,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Search Behavior (Fuse.js)

**Configuration:**
- Threshold: 0.3 (allows fuzzy matches)
- Search fields: `title`, `url`
- Weights: Title matches rank higher than URL matches

**Examples:**
- "kubernetes" → matches "Kubernetes (from URL)"
- "paul" → matches "Paul Graham" posts
- "ai" → matches "AI agent" articles
- "typo" → fuzzy matches similar words

---

## Success Criteria

### Technical
- [x] Node script parses all 3000+ bookmarks from bookmarks.xbel
- [x] Node script extracts all RSS entries from README.md
- [x] SQLite successfully stores RSS entries (no duplicates)
- [x] data.json is generated with correct schema
- [x] React app loads data.json and displays all links
- [x] Fuse.js search works in real-time
- [x] Links are clickable and open in new tab
- [x] GitHub Pages site is live and accessible

### Workflow
- [x] GitHub Actions parse workflow runs on schedule
- [x] GitHub Actions deploy workflow runs on trigger
- [x] Manual triggers work for both workflows
- [x] Updates to bookmarks/RSS sync to live site automatically

### User
- [x] Can search for links by title/URL
- [x] Finds bookmarks and RSS entries in single place
- [x] Sees source context (bookmark folder, RSS feed name)
- [x] Can click to visit any link

---

## Known Unknowns & Future Considerations

### Phase 1 Risks
1. **Bookmark folder structure** - Deep nesting might be slow to parse. Solution: Test with full dataset, optimize parser if needed.
2. **Fuse.js performance** - 3000+ items on client. Solution: Likely fine, but can implement pagination if needed.
3. **SQLite growth** - RSS entries accumulate over time. Solution: Implement archive strategy in Phase 2.

### Phase 2+ Roadmap
1. **REST API** - Convert static JSON to `/api/links` endpoint for mobile/desktop consumption
2. **Metadata tracking** - Add read/unread, timestamps, tags, favorite marking
3. **Mobile app** - React Native consuming REST API
4. **Filtering** - Filter by source, date, feed name
5. **Database migration** - Move from SQLite to proper DB (PostgreSQL, etc.) if needed

### Open Questions (Deferred to Phase 2)
- How strict should bookmark deduplication be? (exact URL vs. domain match)
- How to archive very old RSS entries?
- Should we support exporting bookmarks in other formats?
- Should we sync back to Flocuss if bookmarks are modified?

---

## Implementation Status

**Current:** Design complete, ready to build  
**Next Step:** Choose implementation order:
- Option A: Start with Node script (parse-links.js)
- Option B: Start with React app skeleton
- Option C: Both in parallel

**Estimated Timeline:** 2 weeks for Phase 1 foundation

---

## How to Use This Document

- **Before coding:** Review "Design Decisions" and "Architecture Overview" to understand the full scope
- **During implementation:** Reference "File Structure" and "JSON Data Format" 
- **During testing:** Use "Success Criteria" as checklist
- **For Phase 2:** Reference "Known Unknowns & Future Considerations"
- **For PRs:** Link to this document as design context

---

## Document History

| Date | Author | Change |
|------|--------|--------|
| 2026-05-09 | Abhishek Gowda | Initial design capture from grill-me interview (20 questions) |
