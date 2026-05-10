import type { Link } from '@bookmark/types';
import type { Step } from '@bookmark/pipeline';
import type { AggregationData } from '../pipeline-context.js';
import { getConfig } from '../pipeline-context.js';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * GenerateReadmeStep: Generate and update README with RSS links
 *
 * Input Contract:
 *   - data.projectRoot: Root directory for README location
 *   - data.config: Feed configuration (for ordering and display)
 *   - data.links: Aggregated RSS links from FetchRssStep
 *
 * Output Contract:
 *   - Updates README.md with RSS links grouped by feed
 *   - Each feed gets a section with comment delimiters: <!-- FEED-ID:START/END -->
 *
 * Behavior:
 *   - Groups links by feed (feed property)
 *   - Formats as markdown list items
 *   - Updates or creates sections in README
 *   - Preserves existing non-feed content
 */
export class GenerateReadmeStep implements Step<AggregationData, AggregationData> {
  name = 'GenerateReadme';

  async execute(data: AggregationData): Promise<AggregationData> {
    console.log('📝 Generating README with RSS links...');

    try {
      const projectRoot = data.projectRoot;
      const readmePath = join(projectRoot, 'README.md');

      // Read existing README
      let readmeContent = readFileSync(readmePath, 'utf-8');

      // Get RSS links and config
      const rssLinks = data.links || [];
      const config = getConfig(data);

      // Group links by feed
      const linksByFeed = this.groupLinksByFeed(rssLinks, config);

      // Update README sections for each feed
      for (const feed of config.feeds) {
        const links = linksByFeed.get(feed.id) || [];
        readmeContent = this.updateReadmeSection(readmeContent, feed.id, feed.author, links);
      }

      // Write updated README
      writeFileSync(readmePath, readmeContent, 'utf-8');

      const totalLinks = Array.from(linksByFeed.values()).reduce(
        (sum, links) => sum + links.length,
        0
      );
      console.log(
        `   ✅ Updated README with ${totalLinks} RSS links across ${config.feeds.length} feeds`
      );

      return data;
    } catch (error) {
      console.warn('⚠️  Failed to generate README:', error);
      // Don't throw - this is not a fatal error for the pipeline
      return data;
    }
  }

  /**
   * Group RSS links by feed ID
   */
  private groupLinksByFeed(
    links: Link[],
    config: { feeds: Array<{ id: string }> }
  ): Map<string, Link[]> {
    const grouped = new Map<string, Link[]>();

    // Initialize empty arrays for all configured feeds
    for (const feed of config.feeds) {
      grouped.set(feed.id, []);
    }

    // Group links by feed
    for (const link of links) {
      if (link.feed && grouped.has(link.feed)) {
        grouped.get(link.feed)!.push(link);
      }
    }

    return grouped;
  }

  /**
   * Update or create a section in README for a specific feed
   * Uses HTML comments as delimiters: <!-- FEED-ID:START --> ... <!-- FEED-ID:END -->
   */
  private updateReadmeSection(
    content: string,
    feedId: string,
    feedAuthor: string,
    links: Link[]
  ): string {
    const startDelimiter = `<!-- ${feedId}:START -->`;
    const endDelimiter = `<!-- ${feedId}:END -->`;
    const heading = `## ${feedAuthor}`;

    // Format links as markdown list
    const linkMarkdown = links
      .map((link) => `- [${this.escapeHtml(link.title)}](${link.url})`)
      .join('\n');

    // Build the section content
    const sectionContent = `${heading}\n\n${startDelimiter}\n${linkMarkdown}\n${endDelimiter}`;

    // Check if section already exists
    const startIndex = content.indexOf(startDelimiter);
    const endIndex = content.indexOf(endDelimiter);

    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      // Section exists - replace it
      const beforeSection = content.substring(0, startIndex);
      const afterSection = content.substring(endIndex + endDelimiter.length);

      // Find and replace the heading too (look backwards from startDelimiter)
      const beforeDelimiter = beforeSection.substring(0, startIndex);
      const headingIndex = beforeDelimiter.lastIndexOf(`## ${feedAuthor}`);

      if (headingIndex !== -1) {
        // Replace heading and section together
        const beforeHeading = beforeDelimiter.substring(0, headingIndex);
        return beforeHeading + sectionContent + afterSection;
      } else {
        // Just replace the delimited section
        return beforeSection + sectionContent + afterSection;
      }
    } else {
      // Section doesn't exist - add it at the end
      // But add before Bookmarks section if it exists
      const bookmarksIndex = content.indexOf('## Bookmarks');
      if (bookmarksIndex !== -1) {
        const beforeBookmarks = content.substring(0, bookmarksIndex);
        const bookmarks = content.substring(bookmarksIndex);
        return beforeBookmarks + sectionContent + '\n\n' + bookmarks;
      } else {
        // Add at the end
        return content + '\n\n' + sectionContent;
      }
    }
  }

  /**
   * Escape HTML entities in title
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

export default GenerateReadmeStep;
