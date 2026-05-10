import type { Link } from '@bookmark/types';
import { isLink, generateId } from '@bookmark/validation';
import MarkdownIt from 'markdown-it';
import type { ParseResult, ParseError } from '../registry.js';

/**
 * Parse Markdown format and extract links
 * Uses markdown-it to tokenize and find all links
 * Separates successful links from parsing errors
 * @param content Markdown string
 * @returns ParseResult with links and errors
 */
export async function parseMarkdown(content: string): Promise<ParseResult> {
  try {
    const md = new MarkdownIt();
    const tokens = md.parse(content, {});
    const links: Link[] = [];
    const errors: ParseError[] = [];

    // Walk through tokens to find links
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      // Look for inline tokens containing links
      if (token.type === 'inline' && token.children) {
        for (const child of token.children) {
          if (child.type === 'link_open') {
            try {
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
                } else {
                  errors.push({
                    item: title,
                    error: 'Invalid link structure',
                  });
                }
              }
            } catch (itemError) {
              errors.push({
                item: 'markdown link',
                error: itemError instanceof Error ? itemError.message : String(itemError),
              });
            }
          }
        }
      }
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
          item: 'Markdown document',
          error: error instanceof Error ? error.message : 'Unknown parsing error',
          originalError: error instanceof Error ? error : undefined,
        },
      ],
      success: false,
    };
  }
}
