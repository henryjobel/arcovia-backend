import { FilterXSS } from 'xss';

/**
 * Output/persist-side XSS defense for user-supplied rich text (comments,
 * descriptions…). Admin-only script fields (Settings → custom scripts) are
 * intentionally NOT run through this — they are permission-gated raw HTML.
 */
const richText = new FilterXSS({
  whiteList: {
    a: ['href', 'title', 'target', 'rel'],
    b: [], strong: [], i: [], em: [], u: [], s: [], br: [], p: ['style'],
    ul: [], ol: [], li: [], blockquote: [], code: [], pre: [],
    h1: [], h2: [], h3: [], h4: [], h5: [], h6: [],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    table: [], thead: [], tbody: [], tr: [], th: [], td: [],
    span: ['style'], div: ['style'], figure: [], figcaption: [],
  },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style'],
});

const plainText = new FilterXSS({ whiteList: {}, stripIgnoreTag: true, stripIgnoreTagBody: ['script'] });

export const sanitizeRichHtml = (html) => (typeof html === 'string' ? richText.process(html) : html);
export const stripHtml = (text) => (typeof text === 'string' ? plainText.process(text) : text);
