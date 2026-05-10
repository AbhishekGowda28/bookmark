# Pushing Documentation to GitHub Wiki

This guide explains how to sync the staged wiki documentation to the GitHub wiki repository.

## Overview

The documentation files have been staged in `.wiki/` directory and are ready to be pushed to the GitHub wiki.

**Wiki Repository:** `https://github.com/AbhishekGowda28/bookmark.wiki.git`

## Quick Push (Recommended)

### Option 1: Using gh CLI (Simplest)

If you have `gh` CLI configured with proper authentication:

```bash
# Clone the wiki repository
gh repo clone AbhishekGowda28/bookmark bookmark-wiki -- --depth 1
cd bookmark-wiki

# Copy wiki content
cp -r ../.wiki/* .

# Commit and push
git add -A
git commit -m "docs: Initial wiki with Phase 1 & 2 documentation"
git push origin master
```

### Option 2: Manual Git Push

```bash
# Clone the wiki repository
git clone git@github.com:AbhishekGowda28/bookmark.wiki.git bookmark-wiki
cd bookmark-wiki

# Copy wiki content from main repo
cp -r ../. wiki/* .

# Configure git
git config user.email "your-email@example.com"
git config user.name "Your Name"

# Commit and push
git add -A
git commit -m "docs: Initial wiki with Phase 1 & 2 documentation"
git push origin master
```

### Option 3: Using GitHub CLI API

```bash
# Create wiki pages individually via API
# (This is already set up; just run the commands below)

cd .wiki

# For each markdown file, create a wiki page
for file in *.md; do
  title="${file%.md}"
  # Use gh to create the wiki page
  # (Note: GitHub wiki API is limited; may need manual web interface)
done
```

## What Gets Synced

The following documentation is in `.wiki/`:

### Root Pages
- `Home.md` - Wiki home page with navigation
- `PHASE-1-DESIGN.md` - Phase 1 architecture and design
- `PHASE-1-PRD.md` - Phase 1 requirements
- `CONTEXT.md` - Domain language and core concepts
- `STEP-DEVELOPMENT-GUIDE.md` - How to write pipeline steps
- `ARCHITECTURAL-DEEPENING-OPPORTUNITIES.md` - 9 identified friction points
- `REFACTOR-PLAN.md` - Architecture improvements
- `KANBAN.md` - Sprint tracking
- `ISSUES.md` - Issue definitions

### Subdirectories
- `solutions/best-practices/` - Implementation patterns (config-driven RSS aggregation)
- `plans/` - Detailed planning documents
- `brainstorms/` - Design exploration sessions

## Wiki Page Organization

Once pushed, the wiki will have this structure:

```
Home (index page)
├── Phase 1 Design
├── Phase 2 Config-Driven RSS
├── Context & Domain Language
├── Step Development Guide
├── Architectural Opportunities
├── Refactor Plan
├── Kanban Board
├── Issues Log
└── Solutions & Best Practices
    └── Config-Driven RSS Aggregation
```

## Troubleshooting

### "Repository not found" error

**Issue:** The wiki.wiki.git repository doesn't exist yet.

**Solution:** GitHub creates the wiki repository on first push. Ensure:
1. Wiki is enabled on the main repository (it is)
2. You have push access to the repository
3. Use HTTPS with proper authentication or SSH with configured key

### Authentication issues

**Issue:** "Permission denied (publickey)" or "403 Forbidden"

**Solutions:**
1. Use GitHub CLI: `gh` handles authentication automatically
2. Use HTTPS with personal access token: `git clone https://USERNAME:TOKEN@github.com/AbhishekGowda28/bookmark.wiki.git`
3. Ensure SSH keys are added to GitHub account
4. Check that the account pushing is the repository owner

### Files not appearing in wiki

**Issue:** Files pushed but not visible in web interface

**Solutions:**
1. Check wiki is enabled: `gh api repos/AbhishekGowda28/bookmark --jq '.has_wiki'`
2. Verify files are in root of wiki repo (not in subdirectories)
3. File names should be `Page-Name.md` format (no spaces before extension)
4. Refresh wiki homepage or wait a moment for GitHub to index

## Future Sync

To keep wiki in sync with main documentation:

```bash
# From main repo root
git clone https://github.com/AbhishekGowda28/bookmark.wiki.git bookmark-wiki-sync
cp -r .wiki/* bookmark-wiki-sync/
cd bookmark-wiki-sync
git add -A
git commit -m "docs: Sync documentation updates"
git push
```

Or use a GitHub Action to automate wiki syncs on documentation changes.

---

**Last Updated:** May 10, 2026  
**Status:** Ready to push
