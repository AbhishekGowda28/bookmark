import type { Link } from '@bookmark/types';
import { isLink, generateId } from '@bookmark/validation';
import { parseStringPromise } from 'xml2js';

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
