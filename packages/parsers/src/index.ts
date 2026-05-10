import type { Link, RssEntry } from '@bookmark/types';
import { isLink, generateId } from '@bookmark/validation';
import { parseStringPromise } from 'xml2js';
import MarkdownIt from 'markdown-it';

/**
 * Parse XBEL (XML Bookmark Exchange Language) format
 * Recursively walks the DOM tree and extracts all bookmarks
 * @param content XBEL XML string
 * @returns Array of Link objects
 */
export async function parseXbel(content: string): Promise<Link[]> {
  try {
    const parser = await parseStringPromise(content);
    const links: Link[] = [];

    /**
     * Recursively traverse XBEL tree structure
     * xml2js returns objects where:
     * - Attributes are in $ property
     * - Elements are properties with arrays as values
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function traverse(node: any): void {
      if (!node) return;

      // Process current level bookmarks (xml2js stores as array)
      if (node.bookmark && Array.isArray(node.bookmark)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        node.bookmark.forEach((bookmark: any) => {
          const href = bookmark.$?.href;
          const title = (bookmark.title && bookmark.title[0]) || href || 'Untitled';
          const id = bookmark.$?.id || generateId();

          if (href) {
            // Create link object with all required properties
            const link: Link = {
              id: `xbel-${id}`,
              title: String(title).trim(),
              url: String(href).trim(),
              source: 'bookmark' as const,
            };

            // Validate and add
            if (isLink(link)) {
              links.push(link);
            }
          }
        });
      }

      // Recursively process folders
      if (node.folder && Array.isArray(node.folder)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        node.folder.forEach((folder: any) => {
          traverse(folder);
        });
      }
    }

    // Start traversal from root xbel element
    if (parser.xbel) {
      traverse(parser.xbel);
    }

    return links;
  } catch (error) {
    console.error('Error parsing XBEL:', error);
    return [];
  }
}

/**
 * Parse Markdown format and extract links
 * Uses markdown-it to tokenize and find all links
 * @param content Markdown string
 * @returns Array of Link objects
 */
export function parseMarkdown(content: string): Link[] {
  try {
    const md = new MarkdownIt();
    const tokens = md.parse(content, {});
    const links: Link[] = [];

    // Walk through tokens to find links
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      // Look for inline tokens containing links
      if (token.type === 'inline' && token.children) {
        for (const child of token.children) {
          if (child.type === 'link_open') {
            const href = child.attrGet('href');
            // Find the content of the link in the next tokens
            let title = 'Link';

            // Look for text_token that follows
            for (let j = i; j < tokens.length && j < i + 10; j++) {
              if (tokens[j].type === 'inline' && tokens[j].children) {
                for (const sibling of tokens[j].children!) {
                  if (sibling.type === 'text') {
                    title = sibling.content;
                    break;
                  }
                }
              }
            }

            if (href) {
              // Create link object with all required properties
              const link: Link = {
                id: `markdown-${generateId()}`,
                title: title.trim(),
                url: href.trim(),
                source: 'bookmark' as const,
              };

              // Validate and add
              if (isLink(link)) {
                links.push(link);
              }
            }
          }
        }
      }
    }

    return links;
  } catch (error) {
    console.error('Error parsing Markdown:', error);
    return [];
  }
}

/**
 * Convert RSS entries to Link format
 * @param entries RSS entries from workflow
 * @returns Array of Link objects
 */
export function parseRssEntries(entries: RssEntry[]): Link[] {
  return entries
    .map((entry) => ({
      id: generateId(),
      title: entry.title,
      url: entry.url,
      source: 'rss' as const,
      feed: entry.author,
    }))
    .filter(isLink);
}

export default {
  parseXbel,
  parseMarkdown,
  parseRssEntries,
};
