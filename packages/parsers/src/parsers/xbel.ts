import type { Link } from '@bookmark/types';
import { isLink, generateId } from '@bookmark/validation';
import { parseStringPromise } from 'xml2js';
import type { ParseResult, ParseError } from '../registry.js';

/**
 * Parse XBEL (XML Bookmark Exchange Language) format
 * Recursively walks the DOM tree and extracts all bookmarks
 * Separates successful links from parsing errors
 * @param content XBEL XML string
 * @returns ParseResult with links and errors
 */
export async function parseXbel(content: string): Promise<ParseResult> {
  const links: Link[] = [];
  const errors: ParseError[] = [];

  try {
    const parser = await parseStringPromise(content);

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
         node.bookmark.forEach((bookmark: any, index: number) => {
           try {
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
               } else {
                 errors.push({
                   item: String(title),
                   error: 'Invalid link structure',
                 });
               }
             } else {
               // Record error for bookmark without href
               errors.push({
                 item: String(title),
                 error: 'Bookmark missing href attribute',
               });
             }
           } catch (itemError) {
             errors.push({
               item: `bookmark[${index}]`,
               error: itemError instanceof Error ? itemError.message : String(itemError),
               originalError: itemError instanceof Error ? itemError : undefined,
             });
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

    return {
      links,
      errors,
      success: links.length > 0 || errors.length === 0,
    };
  } catch (error) {
    return {
      links: [],
      errors: [
        {
          item: 'XBEL document',
          error: error instanceof Error ? error.message : 'Unknown parsing error',
          originalError: error instanceof Error ? error : undefined,
        },
      ],
      success: false,
    };
  }
}
