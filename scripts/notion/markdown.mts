/**
 * Page bodies, via Notion's native markdown export.
 *
 * The API returns markdown directly (pages.retrieveMarkdown), so there is no
 * block-tree walk and no converter to maintain: equation blocks come back as
 * $$...$$ and code blocks as fenced blocks, which is exactly what remark-math
 * and rehype-pretty-code in lib/mdx.tsx already consume.
 */

import type { Client } from "@notionhq/client";

/**
 * Notion writes an inline equation as $`x`$ rather than $x$. remark-math only
 * understands the latter; left alone, the backticks turn the formula into an
 * inline code span and the maths never renders.
 */
function normaliseInlineMath(markdown: string): string {
  return markdown.replace(/\$`([^`\n]+)`\$/g, "$$$1$$");
}

type LineKind = "list" | "quote" | "table" | "other";

function lineKind(line: string): LineKind {
  if (/^\s*([-*+]|\d+[.)])\s/.test(line)) return "list";
  if (/^\s*>/.test(line)) return "quote";
  if (/^\s*\|.*\|\s*$/.test(line)) return "table";
  return "other";
}

/**
 * Notion's export separates top-level blocks with a single newline, which in
 * markdown means "same paragraph" -- so consecutive paragraphs would render
 * merged into one. Put the blank lines back.
 *
 * List items, blockquote lines and table rows stay adjacent: separating those
 * would turn a tight list loose and break GFM tables outright.
 */
function separateBlocks(markdown: string): string {
  const lines = markdown.split("\n");
  const out: string[] = [];
  let previous: LineKind | null = null;
  let index = 0;

  const push = (block: string, kind: LineKind | null) => {
    const runsOn = kind !== null && kind !== "other" && kind === previous;
    if (out.length > 0 && !runsOn) out.push("");
    out.push(block);
    previous = kind;
  };

  /** Consumes a multi-line block delimited by the same marker at both ends. */
  const consumeFenced = (isDelimiter: (line: string) => boolean): string => {
    const block = [lines[index]];
    index += 1;
    while (index < lines.length) {
      block.push(lines[index]);
      const closed = isDelimiter(lines[index]);
      index += 1;
      if (closed) break;
    }
    return block.join("\n");
  };

  while (index < lines.length) {
    const line = lines[index];

    // Existing blank lines are dropped and reinserted, so runs of them cannot
    // accumulate across repeated syncs.
    if (line.trim() === "") {
      index += 1;
      continue;
    }

    const fence = /^\s*(```|~~~)/.exec(line);
    if (fence) {
      const marker = fence[1];
      push(
        consumeFenced((l) => l.trimStart().startsWith(marker)),
        null,
      );
      continue;
    }

    if (/^\s*\$\$\s*$/.test(line)) {
      push(
        consumeFenced((l) => /^\s*\$\$\s*$/.test(l)),
        null,
      );
      continue;
    }

    // An indented line after a list item continues that item.
    if (previous === "list" && /^\s+\S/.test(line)) {
      out.push(line);
      index += 1;
      continue;
    }

    push(line, lineKind(line));
    index += 1;
  }

  return out.join("\n");
}

/**
 * Bodies are compiled as MDX, not plain markdown, so a literal `{`, `}` or `<`
 * typed in Notion prose is a *compile error* rather than a rendered character.
 * Escaping has to skip code and math, where those characters are legitimate --
 * `\{` inside a code fence would render as a backslash.
 */
export function escapeForMdx(markdown: string): string {
  const lines = markdown.split("\n");
  let inFence = false;
  let inMathBlock = false;

  return lines
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        inFence = !inFence;
        return line;
      }
      if (inFence) return line;

      if (/^\s*\$\$\s*$/.test(line)) {
        inMathBlock = !inMathBlock;
        return line;
      }
      if (inMathBlock) return line;

      return escapeInline(line);
    })
    .join("\n");
}

/** Escapes MDX-significant characters outside inline code and inline math. */
function escapeInline(line: string): string {
  // Split on inline code spans (`x`, ``x``) and inline math ($x$), keeping the
  // delimiters, so only the prose between them is escaped.
  const parts = line.split(/(`+[^`]*`+|\$[^$\n]+\$)/g);
  return parts
    .map((part, index) => (index % 2 === 1 ? part : escapeText(part)))
    .join("");
}

function escapeText(text: string): string {
  // The negative lookbehind leaves an already-escaped character alone rather
  // than turning \{ into \\{.
  return text.replace(/(?<!\\)[{}<]/g, (char) => `\\${char}`);
}

/**
 * Notion reports content it could not express as markdown instead of dropping
 * it silently. Both signals are treated as fatal: shipping a post with a
 * missing section is worse than failing the sync.
 */
export async function fetchMarkdown(
  notion: Client,
  pageId: string,
  label: string,
): Promise<string> {
  const response = await notion.pages.retrieveMarkdown({ page_id: pageId });

  if (response.truncated) {
    throw new Error(
      `The body of ${label} was truncated by Notion's markdown export.\n` +
        `  Split it into shorter pages, or shorten the content.`,
    );
  }
  if (response.unknown_block_ids.length > 0) {
    throw new Error(
      `The body of ${label} contains ${response.unknown_block_ids.length} block(s) ` +
        `that Notion cannot export as markdown.\n` +
        `  Usually a synced block, a linked database view, or a button.\n` +
        `  Replace them with ordinary content. Block ids: ${response.unknown_block_ids.join(", ")}`,
    );
  }

  return separateBlocks(normaliseInlineMath(response.markdown)).trim();
}

const IMAGE = /!\[([^\]]*)\]\(([^)\s]+)(\s+"[^"]*")?\)/g;

/** Every image URL referenced by a body, in order, deduplicated. */
export function imageUrls(markdown: string): string[] {
  const found = new Set<string>();
  for (const match of markdown.matchAll(IMAGE)) found.add(match[2]);
  return [...found];
}

/**
 * Notion's file URLs are signed and expire in about an hour, so a body that
 * still points at one renders broken images shortly after the build.
 */
export function rewriteImageUrls(
  markdown: string,
  replacements: Map<string, string>,
): string {
  return markdown.replace(IMAGE, (whole, alt: string, href: string) => {
    const local = replacements.get(href);
    return local ? `![${alt}](${local})` : whole;
  });
}

/**
 * The single fenced code block holding a BibTeX entry. Publications keep their
 * BibTeX in the page body rather than a property because a rich text property
 * caps at 2000 characters, which an entry with an abstract exceeds.
 */
export function singleCodeBlock(markdown: string, label: string): string {
  const blocks = [
    ...markdown.matchAll(
      /^[ \t]*(?:```|~~~)[^\n]*\n([\s\S]*?)^[ \t]*(?:```|~~~)[ \t]*$/gm,
    ),
  ]
    .map((match) => match[1].trim())
    .filter(Boolean);

  if (blocks.length === 0) {
    throw new Error(
      `${label} has no code block in its body.\n` +
        `  Paste the BibTeX entry into a code block (type /code in Notion).`,
    );
  }
  if (blocks.length > 1) {
    throw new Error(
      `${label} has ${blocks.length} code blocks in its body, expected exactly one BibTeX entry.`,
    );
  }
  return blocks[0];
}
