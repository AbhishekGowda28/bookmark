#!/bin/bash

# Wiki Push Script for Bookmark Project
# Automates pushing documentation to GitHub wiki

set -e

REPO_OWNER="AbhishekGowda28"
REPO_NAME="bookmark"
WIKI_URL="https://github.com/${REPO_OWNER}/${REPO_NAME}.wiki.git"
WIKI_DIR="./bookmark-wiki-temp"

echo "📚 Bookmark & RSS Aggregator - Wiki Push Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if .wiki directory exists
if [ ! -d ".wiki" ]; then
    echo "❌ Error: .wiki directory not found"
    echo "   Run this script from the repository root"
    exit 1
fi

echo "📖 Step 1: Cloning wiki repository..."
if [ -d "$WIKI_DIR" ]; then
    rm -rf "$WIKI_DIR"
fi

if git clone "$WIKI_URL" "$WIKI_DIR" 2>/dev/null; then
    echo "✅ Wiki repository cloned"
else
    echo "⚠️  Wiki repository is empty (first push)"
    mkdir -p "$WIKI_DIR"
    cd "$WIKI_DIR"
    git init
    git remote add origin "$WIKI_URL"
    cd ..
fi

echo ""
echo "📝 Step 2: Copying documentation files..."
cp -r .wiki/* "$WIKI_DIR/" || true
rm -f "$WIKI_DIR/.gitkeep"
echo "✅ Files copied"

echo ""
echo "📦 Step 3: Staging changes..."
cd "$WIKI_DIR"

# Configure git if needed
if [ -z "$(git config user.name)" ]; then
    git config user.email "wiki-bot@bookmark.local"
    git config user.name "Bookmark Wiki Bot"
fi

git add -A

# Check if there are changes
if git diff-index --quiet HEAD --; then
    echo "ℹ️  No changes to commit"
    cd ..
    rm -rf "$WIKI_DIR"
    exit 0
fi

echo "✅ Changes staged"

echo ""
echo "💾 Step 4: Committing changes..."
git commit -m "docs: Sync documentation to wiki

- Phase 1 & 2 design and architecture
- Step development guide and patterns
- Config-driven RSS aggregation learnings
- Planning documents and best practices

Synced: $(date '+%Y-%m-%d %H:%M:%S')" || true

echo "✅ Changes committed"

echo ""
echo "🚀 Step 5: Pushing to GitHub wiki..."
git push -u origin master

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Wiki push complete!"
echo ""
echo "📖 Wiki URL: https://github.com/${REPO_OWNER}/${REPO_NAME}/wiki"
echo ""

# Cleanup
cd ..
rm -rf "$WIKI_DIR"

echo "🎉 Documentation is now available in your GitHub wiki!"
