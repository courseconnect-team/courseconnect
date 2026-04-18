/**
 * markdownToPreview
 * -----------------
 *
 * A deliberately-narrow utility that converts the subset of Markdown the
 * Announcements composer produces (via `@uiw/react-md-editor` + a custom
 * `<u>` command) into a single-line, plain-text preview suitable for a
 * row with `text-ellipsis` truncation.
 *
 * This is NOT a general-purpose Markdown parser. The real, full-fidelity
 * rendering happens in the detail view through
 * `@uiw/react-markdown-preview`. Here we only strip the handful of
 * formatting characters users commonly see in a list preview so the row
 * doesn't leak raw `**`, `##`, backticks, or link syntax.
 *
 * Transformations (all intentionally conservative):
 *   - Fenced code blocks (``` ... ```): replaced with their inner content.
 *   - Inline code (`code`): inner text kept, backticks removed.
 *   - Bold (`**x**`, `__x__`): inner text kept.
 *   - Italic (`*x*`, `_x_`): inner text kept.
 *   - Strikethrough (`~~x~~`): inner text kept.
 *   - Headings (`#`..`######` at line start): hash characters dropped.
 *   - List markers (`- `, `* `, `+ `, `1. `) at line start: dropped.
 *   - Blockquote (`> `) at line start: dropped.
 *   - Links (`[text](url)`): `text` kept, URL dropped.
 *   - Images (`![alt](url)`): `alt` kept, URL dropped.
 *   - HTML tags (e.g. the composer's `<u>...</u>`): tags removed, text kept.
 *   - All whitespace (including newlines) collapsed to a single space.
 */
export function markdownToPreview(md: string): string {
  if (!md) return '';

  let s = md;

  // 1. Fenced code blocks: ```lang\n<body>\n```  → keep <body>.
  //    Use a non-greedy body so consecutive blocks don't fuse.
  s = s.replace(/```[^\n]*\n?([\s\S]*?)```/g, (_m, body) => body);

  // 2. Inline code: `code` → code
  s = s.replace(/`([^`]+)`/g, (_m, body) => body);

  // 3. Images: ![alt](url) → alt   (run BEFORE links)
  s = s.replace(/!\[([^\]]*)\]\([^)]*\)/g, (_m, alt) => alt);

  // 4. Links: [text](url) → text
  s = s.replace(/\[([^\]]*)\]\([^)]*\)/g, (_m, text) => text);

  // 5. Strip HTML tags (e.g. the composer's <u>...</u>). Keep inner text.
  s = s.replace(/<\/?[a-zA-Z][^>]*>/g, '');

  // 6. Strikethrough: ~~text~~ → text
  s = s.replace(/~~([^~]+)~~/g, (_m, body) => body);

  // 7. Bold: **text** or __text__ → text   (BEFORE italic; emphasis tokens
  //    can overlap, so run greedy-longer-first.)
  s = s.replace(/\*\*([^*]+)\*\*/g, (_m, body) => body);
  s = s.replace(/__([^_]+)__/g, (_m, body) => body);

  // 8. Italic: *text* or _text_ → text
  s = s.replace(/\*([^*]+)\*/g, (_m, body) => body);
  s = s.replace(/_([^_]+)_/g, (_m, body) => body);

  // 9. Line-leading markers: headings, list bullets, ordered-list numbers,
  //    blockquote carets. Process each line so leading whitespace is
  //    preserved as a word boundary, then collapse at the end.
  s = s
    .split('\n')
    .map((line) => {
      let t = line;
      // Heading: one or more '#' followed by space
      t = t.replace(/^\s*#{1,6}\s+/, '');
      // Blockquote
      t = t.replace(/^\s*>\s?/, '');
      // Unordered list marker
      t = t.replace(/^\s*[-*+]\s+/, '');
      // Ordered list marker (e.g. "1. ")
      t = t.replace(/^\s*\d+\.\s+/, '');
      return t;
    })
    .join('\n');

  // 10. Collapse all runs of whitespace (including newlines) into a single
  //     space. Trim the ends.
  s = s.replace(/\s+/g, ' ').trim();

  return s;
}
