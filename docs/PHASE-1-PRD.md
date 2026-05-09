# Phase 1 PRD: Link Retrieval System

**Date:** May 9, 2026  
**Product:** Searchable Link Aggregator  
**Phase:** 1 (Web App MVP)  
**User:** Solo - Abhishek Gowda  
**Status:** Ready for Development

---

## 1. Overview

A searchable, single-interface solution to retrieve and discover all saved links in one place.

**Problem:** Links are scattered across three sources (Flocuss bookmarks, browser tabs, RSS feeds in README). Finding a specific link requires jumping between multiple tools and contexts.

**Solution:** Aggregate all links into a searchable web interface with fuzzy search, eliminating context-switching and enabling quick link discovery.

**User:** Solo power user who aggressively bookmarks and reads RSS feeds.

**Why It Matters:** Enables faster knowledge retrieval and rediscovery of saved resources. Currently, a 10-second manual search could become a 1-second interface search.

---

## 2. User Stories & Core Use Cases

### Use Case 1: Quick Link Search
**Scenario:** "I remember reading an article about 'kubernetes' but can't recall where I saved it. I want to find it in 5 seconds."

- User opens the web app
- Types "kubernetes" in search
- Sees all matching bookmarks + RSS entries
- Clicks link to open

**Benefit:** Replaces manual browsing of Flocuss or README.md

### Use Case 2: Link Rediscovery
**Scenario:** "I want to remember what I was reading about 'AI agents' last month. I search and browse through results to rediscover useful content."

- User opens web app
- Types "agents"
- Sees all related bookmarks and RSS entries
- Rediscovers articles and resources

**Benefit:** Serendipity—finding forgotten but relevant links

### Use Case 3: Source Context
**Scenario:** "I found a great link, but I want to know if it's from a formal bookmark or an RSS feed. This helps me understand context."

- User sees link with source badge (bookmark / RSS: Feed Name)
- Understands where the link came from

**Benefit:** Context awareness for better filtering and discovery

---

## 3. Feature Scope

### In Scope (Phase 1)

✅ **Search Functionality**
- Fuzzy search across all links (handles typos and partial matches)
- Real-time search results (instant feedback as user types)
- Search across link titles and URLs

✅ **Data Aggregation**
- Parse bookmarks from bookmarks.xbel (3000+ links)
- Parse tabs from tabs.xbel (~20 links)
- Parse RSS feeds from README.md (~50+ entries)
- Deduplicate links across sources

✅ **Display & UX**
- Searchable list view (minimalist, no cards or heavy styling)
- Each link shows: title (clickable) + URL + source badge
- Source badges show "bookmark" or "rss: Feed Name"
- Links open in new tab when clicked

✅ **Performance**
- Search completes in < 100ms
- App loads in < 2 seconds
- Handles 3000+ links without lag

✅ **Data Pipeline**
- Node.js script parses files → outputs JSON
- Script runs on daily schedule + manual trigger
- GitHub Actions automates data refresh
- GitHub Pages hosts the web app

✅ **No Manual Updates**
- User doesn't manually manage the list
- Bookmarks auto-sync via Flocuss
- RSS feeds auto-update via GitHub Actions
- Web app always reflects latest data

### Out of Scope (Phase 1)

❌ **Metadata Tracking**
- No read/unread status
- No timestamps or date added
- No custom tags or categories
- No favorite/bookmark marking

❌ **Filtering & Sorting**
- No filter by source (bookmark vs. RSS)
- No filter by date or feed name
- No custom sorting options

❌ **User Features**
- No user authentication / login
- No multi-user support
- No collaborative features
- No sharing or exporting

❌ **Analytics & Tracking**
- No usage analytics
- No view counts or click tracking
- No telemetry

❌ **Platform Scope**
- No mobile app (Phase 3)
- No REST API (Phase 2)
- No browser extension
- No desktop app

---

## 4. Acceptance Criteria

### Search Functionality
- ✓ **Exact match:** Searching "Paul Graham" returns all Paul Graham articles
- ✓ **Partial match:** Searching "paul" returns Paul Graham results
- ✓ **Fuzzy match:** Searching "pual" (typo) returns Paul Graham results
- ✓ **URL search:** Searching "github.com" returns links from GitHub URLs
- ✓ **No results:** Searching "xyzabc123" shows "No results" message
- ✓ **Search speed:** Results display within 100ms of typing

### Display & Navigation
- ✓ **Link display:** Each result shows title, full URL, and source badge
- ✓ **Clickable links:** Clicking a link opens it in a new tab
- ✓ **Source badges:** Bookmarks show "bookmark", RSS entries show "rss: Feed Name"
- ✓ **Minimalist UI:** Clean layout with search box at top, results below
- ✓ **Empty state:** Displaying helpful message when no results match

### Data Aggregation
- ✓ **Bookmarks included:** All 3000+ bookmarks from bookmarks.xbel are searchable
- ✓ **Tabs included:** All tabs from tabs.xbel are searchable
- ✓ **RSS included:** All RSS entries from README.md are searchable
- ✓ **No duplicates:** Same URL appearing in multiple sources shows only once
- ✓ **Data freshness:** Latest bookmarks/RSS appear within 24 hours (via scheduled job)

### Performance & Reliability
- ✓ **Load time:** Page loads in < 2 seconds
- ✓ **Search responsiveness:** No UI lag when typing
- ✓ **Data format:** JSON is valid and contains all required fields (title, url, source)
- ✓ **Offline capability:** Web app works offline (static JSON, no API calls)
- ✓ **Browser compatibility:** Works in Chrome, Firefox, Safari

### Automation & Deployment
- ✓ **Daily refresh:** Parser script runs daily, updates data.json
- ✓ **Manual trigger:** User can manually trigger parser to refresh immediately
- ✓ **Auto-deploy:** Updated data automatically deploys to live site
- ✓ **GitHub Pages:** Site is live and accessible at https://abhishekgowda.github.io/bookmark/
- ✓ **No manual updates:** User doesn't need to manually update the web app

---

## 5. Success Metrics

**Solo-user success is measured by utility, not engagement:**

✅ **Primary Metric:** "I use this tool regularly to find links instead of manually checking bookmarks or README"

✅ **Secondary Signals:**
- Search finds what I'm looking for within 3 attempts
- I discover forgotten-but-useful links during search
- The UI feels fast and responsive
- I trust the system has all my links

✅ **The system succeeds when:** You prefer using it over manually checking Flocuss or README.md

---

## 6. Constraints

### Data & Storage
- All data stays in git repo (bookmarks.xbel, tabs.xbel, README.md)
- SQLite (links.db) stores RSS history locally
- No external databases or cloud storage in Phase 1

### Deployment
- Static hosting via GitHub Pages
- No backend server required for Phase 1
- Data is read-only on the frontend (no mutations)

### Technology
- Frontend: React + Fuse.js
- Backend: Node.js parser script
- Infrastructure: GitHub Actions + GitHub Pages
- No third-party APIs or external services

### Scope
- Phase 1 is web app only
- Phase 2: REST API
- Phase 3: Mobile app
- No dependency on completing Phase 2/3 for Phase 1 to be useful

### Browser/Network
- Works in modern browsers (Chrome, Firefox, Safari, Edge)
- Requires internet access to load initially, but works offline after
- No service workers or offline-first caching in Phase 1

---

## 7. Non-Goals (Explicitly Out of Scope)

🚫 **We are NOT building:**

- **Tracking/Analytics** - No usage metrics, view counts, or telemetry
- **Social Features** - No sharing, no collaboration, no public links
- **Authentication** - Single user, no login system
- **Mutation/Editing** - Cannot add, delete, or rename links in the app
- **Multiple Users** - Not a team tool
- **Metadata Management** - No tagging, favoriting, or notes in Phase 1
- **Advanced Filtering** - No complex query builders or saved searches
- **Notifications** - No alerts for new RSS entries
- **Browser Integration** - No extension or browser sync
- **Export/Import** - No backup or sync to external services

---

## 8. Success Criteria Checklist for QA/Review

Before declaring Phase 1 complete, verify:

- [ ] All 3000+ bookmarks from bookmarks.xbel are in the search index
- [ ] All tabs from tabs.xbel are searchable
- [ ] All RSS entries from README.md appear in search
- [ ] Search for "kubernetes" returns expected results
- [ ] Search for "paul" returns Paul Graham feed entries
- [ ] Search for "ai" returns AI-related articles
- [ ] Clicking a link opens in a new tab
- [ ] Source badges display correctly (bookmark / rss: Feed Name)
- [ ] Search response time is < 100ms
- [ ] Page loads completely in < 2 seconds
- [ ] No JavaScript errors in browser console
- [ ] GitHub Pages site is live and accessible
- [ ] Manual parser trigger works
- [ ] Daily scheduled parser run executes
- [ ] Updated data.json appears on live site within 24 hours

---

## 9. Document Relationships

- **PHASE-1-DESIGN.md** - Technical architecture, implementation details, file structure
- **PHASE-1-PRD.md** (this file) - User-facing behavior, acceptance criteria, success definition

**How to use together:**
- Start with **PRD** to understand WHAT we're building
- Reference **DESIGN** to understand HOW we're building it
- Both should align: PRD acceptance criteria → DESIGN implementation plan

---

## Document History

| Date | Author | Change |
|------|--------|--------|
| 2026-05-09 | Abhishek Gowda | Initial lightweight PRD from user requirements |
