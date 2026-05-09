/**
 * Parse Links Script
 * 
 * Aggregates bookmarks (bookmarks.xbel + tabs.xbel) and RSS feeds (README.md)
 * into a single searchable list and outputs to web/public/data.json
 * 
 * Usage: npm run dev
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseStringPromise } from 'xml2js';
import { v4 as uuidv4 } from 'uuid';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..');
const BOOKMARKS_FILE = path.join(ROOT_DIR, 'bookmarks.xbel');
const TABS_FILE = path.join(ROOT_DIR, 'tabs.xbel');
const README_FILE = path.join(ROOT_DIR, 'README.md');
const OUTPUT_FILE = path.join(ROOT_DIR, 'web/public/data.json');
const DB_FILE = path.join(ROOT_DIR, 'links.db');

console.log('📖 Bookmark Parser Started');
console.log('---');

/**
 * Initialize SQLite database for RSS entries
 */
function initializeDatabase() {
  try {
    const db = new Database(DB_FILE);
    
    // Create RSS entries table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS rss_entries (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        url TEXT NOT NULL UNIQUE,
        feed_name TEXT,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    return db;
  } catch (error) {
    console.error('Error initializing database:', error.message);
    throw error;
  }
}

/**
 * Append RSS entries to database (ignore duplicates)
 */
function appendRSSEntries(db, rssFeeds) {
  try {
    const insert = db.prepare(`
      INSERT OR IGNORE INTO rss_entries (id, title, url, feed_name)
      VALUES (?, ?, ?, ?)
    `);
    
    let insertedCount = 0;
    for (const feed of rssFeeds) {
      const result = insert.run(feed.id, feed.title, feed.url, feed.feed);
      if (result.changes > 0) {
        insertedCount++;
      }
    }
    
    return insertedCount;
  } catch (error) {
    console.error('Error appending RSS entries to database:', error.message);
    throw error;
  }
}

/**
 * Parse README.md and extract RSS feed entries
 */
function parseRSSFeeds(readmeContent) {
  const feeds = [];
  
  // Find all RSS feed sections using markers <!-- FEEDNAME:START --> to <!-- FEEDNAME:END -->
  const feedRegex = /<!--\s*([^:]+):START\s*-->([\s\S]*?)<!--\s*\1:END\s*-->/g;
  let match;
  
  while ((match = feedRegex.exec(readmeContent)) !== null) {
    const feedName = match[1].trim();
    const content = match[2];
    
    // Extract markdown links from the section: - [Title](URL)
    const linkRegex = /^[-*]\s*\[([^\]]+)\]\(([^)]+)\)$/gm;
    let linkMatch;
    
    while ((linkMatch = linkRegex.exec(content)) !== null) {
      const title = linkMatch[1];
      const url = linkMatch[2];
      
      feeds.push({
        id: uuidv4(),
        title: title.trim(),
        url: url.trim(),
        source: 'rss',
        feed: feedName
      });
    }
  }
  
  return feeds;
}

/**
 * Parse XBEL file and extract all bookmarks recursively
 */
async function parseXBEL(filePath, source = 'bookmark') {
  try {
    const xml = fs.readFileSync(filePath, 'utf8');
    const parsed = await parseStringPromise(xml);
    
    const bookmarks = [];
    
    /**
     * Recursively extract bookmarks from folder structure
     */
    function extractBookmarks(items) {
      if (!items || !Array.isArray(items)) return;
      
      for (const item of items) {
        // Handle bookmarks
        if (item.bookmark) {
          const bookmarkArray = Array.isArray(item.bookmark) ? item.bookmark : [item.bookmark];
          for (const bm of bookmarkArray) {
            const href = bm.$ && bm.$.href ? bm.$.href : null;
            const title = bm.title && bm.title[0] ? bm.title[0] : 'Untitled';
            
            if (href) {
              bookmarks.push({
                id: uuidv4(),
                title: title.trim(),
                url: href,
                source: source
              });
            }
          }
        }
        
        // Recursively handle nested folders
        if (item.folder) {
          const folderArray = Array.isArray(item.folder) ? item.folder : [item.folder];
          for (const folder of folderArray) {
            extractBookmarks([folder]);
          }
        }
      }
    }
    
    // Start extraction from root xbel
    const xbel = parsed.xbel;
    if (xbel) {
      extractBookmarks([xbel]);
    }
    
    return bookmarks;
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error.message);
    return [];
  }
}

/**
 * Merge all link sources and deduplicate by URL
 */
function mergeAndDeduplicate(bookmarks, tabs, rssFeeds) {
  const allLinks = [...bookmarks, ...tabs, ...rssFeeds];
  
  // Track URLs we've seen to deduplicate
  const urlMap = new Map();
  const deduplicated = [];
  
  for (const link of allLinks) {
    const url = link.url.toLowerCase().trim();
    
    if (!urlMap.has(url)) {
      urlMap.set(url, link);
      deduplicated.push(link);
    }
    // If URL already exists, we keep the first one (no action needed)
  }
  
  return deduplicated;
}

/**
 * Write data.json output file
 */
function writeDataJSON(links, outputPath) {
  try {
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const jsonData = JSON.stringify(links, null, 2);
    fs.writeFileSync(outputPath, jsonData, 'utf8');
    
    return fs.statSync(outputPath).size;
  } catch (error) {
    console.error('Error writing data.json:', error.message);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('📚 Parsing bookmarks.xbel...');
    const startTime = Date.now();
    
    const bookmarks = await parseXBEL(BOOKMARKS_FILE, 'bookmark');
    console.log(`✓ Extracted ${bookmarks.length} bookmarks`);
    
    console.log('📑 Parsing tabs.xbel...');
    const tabs = await parseXBEL(TABS_FILE, 'bookmark');
    console.log(`✓ Extracted ${tabs.length} tabs`);
    
    console.log('📰 Parsing README.md RSS feeds...');
    const readme = fs.readFileSync(README_FILE, 'utf8');
    const rssFeeds = parseRSSFeeds(readme);
    console.log(`✓ Extracted ${rssFeeds.length} RSS entries`);
    
    console.log('💾 Initializing SQLite database...');
    const db = initializeDatabase();
    const inserted = appendRSSEntries(db, rssFeeds);
    console.log(`✓ Database initialized, ${inserted} RSS entries stored`);
    db.close();
    
    console.log('🔗 Merging and deduplicating...');
    const merged = mergeAndDeduplicate(bookmarks, tabs, rssFeeds);
    console.log(`✓ Merged ${merged.length} unique links (deduplicated ${bookmarks.length + tabs.length + rssFeeds.length - merged.length} duplicates)`);
    
    console.log('📝 Writing data.json...');
    const fileSize = writeDataJSON(merged, OUTPUT_FILE);
    console.log(`✓ data.json written (${(fileSize / 1024).toFixed(1)}KB)`);
    
    const elapsedTime = Date.now() - startTime;
    
    console.log(`\n📊 Summary:`);
    console.log(`   Bookmarks: ${bookmarks.length}`);
    console.log(`   Tabs: ${tabs.length}`);
    console.log(`   RSS entries: ${rssFeeds.length}`);
    console.log(`   Unique links (after dedup): ${merged.length}`);
    console.log(`   Total parser time: ${elapsedTime}ms`);
    
    // Sample output
    console.log(`\n📌 Sample output (first 3):`);
    merged.slice(0, 3).forEach((link, idx) => {
      const source = link.source === 'rss' ? `rss: ${link.feed}` : 'bookmark';
      console.log(`   ${idx + 1}. ${link.title.substring(0, 40)}... (${source})`);
    });
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
