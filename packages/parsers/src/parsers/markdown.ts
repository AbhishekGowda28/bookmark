import type { Link } from '@bookmark/types';
import { isLink, generateId } from '@bookmark/validation';
import MarkdownIt from 'markdown-it';

/**
 * Parse Markdown format and extract links
 * Uses markdown-it to tokenize and find all links
 * @param content Markdown string
 * @returns Array of Link objects
 */
export async function parseMarkdown(content: string): Promise<Link[]> {
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
