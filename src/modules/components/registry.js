/**
 * Static registry of section/component types available in the visual page
 * editor. Deliberately code, not a DB collection: admins arrange, fill in,
 * and reorder instances of these types on a page — they don't invent new
 * types from the UI (see plan decision #2). All *content* stays 100%
 * database-driven; only this palette of shapes is fixed.
 *
 * Each `fields` entry follows core/schemas/fieldDef.schema.js and drives the
 * admin SchemaForm renderer automatically — no per-section admin UI needed.
 *
 * Every field below maps to something the corresponding public renderer
 * actually does with it — no decorative "alignment"/"spacing" controls that
 * the hand-tuned section components would silently ignore.
 */

const heading = (key = 'heading', label = 'Heading', extra = {}) => ({ key, label, type: 'text', ...extra });
const paragraph = (key = 'text', label = 'Paragraph') => ({ key, label, type: 'textarea' });
const eyebrow = (label = 'Eyebrow / Kicker') => ({ key: 'eyebrow', label, type: 'text' });
const image = (key = 'image', label = 'Image') => ({ key, label, type: 'media' });
const bgImage = () => ({ key: 'backgroundImage', label: 'Background image', type: 'media' });
const button = (key = 'button', label = 'Button') => ({
  key,
  label,
  type: 'repeater',
  of: [
    { key: 'label', label: 'Button text', type: 'text', required: true },
    { key: 'link', label: 'Link', type: 'link', required: true },
  ],
});

export const COMPONENT_DEFINITIONS = [
  {
    key: 'page-hero',
    name: 'Page Banner',
    icon: 'PanelTop',
    category: 'basic',
    supportsDynamicSource: false,
    fields: [
      heading('crumbLabel', 'Breadcrumb label'),
      eyebrow(),
      heading('heading', 'Title', { required: true }),
      paragraph('intro', 'Description'),
      image('image', 'Background image'),
    ],
  },
  {
    key: 'features',
    name: 'Features / Why Choose Us',
    icon: 'ListChecks',
    category: 'content',
    supportsDynamicSource: false,
    fields: [
      eyebrow(),
      heading(),
      {
        key: 'items',
        label: 'Feature items',
        type: 'repeater',
        of: [heading('title', 'Title', { required: true }), paragraph('description', 'Description')],
      },
    ],
  },
  {
    key: 'hero',
    name: 'Hero',
    icon: 'Sparkles',
    category: 'basic',
    supportsDynamicSource: false,
    fields: [
      {
        key: 'slides',
        label: 'Slides',
        type: 'repeater',
        of: [heading('heading', 'Heading', { required: true }), paragraph('body', 'Body text'), image('image', 'Background image')],
      },
      { key: 'autoplaySeconds', label: 'Autoplay delay (seconds, 0 = off)', type: 'number', default: 7 },
    ],
  },
  {
    key: 'text-image',
    name: 'Text & Image',
    icon: 'LayoutPanelLeft',
    category: 'content',
    supportsDynamicSource: false,
    fields: [
      eyebrow(),
      heading(),
      { key: 'body', label: 'Rich text', type: 'richtext' },
      image('image', 'Main image'),
      image('secondaryImage', 'Secondary accent image (optional)'),
      button('cta', 'CTA button (optional)'),
    ],
  },
  {
    key: 'services-grid',
    name: 'Services Grid',
    icon: 'LayoutGrid',
    category: 'content',
    supportsDynamicSource: true,
    dynamicKinds: ['entries'],
    fields: [eyebrow(), heading(), paragraph('intro', 'Intro text'), { key: 'limit', label: 'Items to show (0 = all)', type: 'number', default: 5 }, button('cta', 'View-all button (optional)')],
  },
  {
    key: 'portfolio-grid',
    name: 'Portfolio Grid',
    icon: 'GalleryHorizontal',
    category: 'content',
    supportsDynamicSource: true,
    dynamicKinds: ['entries'],
    fields: [eyebrow(), heading(), { key: 'limit', label: 'Items to show (0 = all)', type: 'number', default: 4 }, button('cta', 'View-all button (optional)')],
  },
  {
    key: 'stats-counter',
    name: 'Statistics / Counters',
    icon: 'TrendingUp',
    category: 'content',
    supportsDynamicSource: false,
    fields: [
      {
        key: 'stats',
        label: 'Stats',
        type: 'repeater',
        of: [
          { key: 'value', label: 'Value', type: 'number', required: true },
          { key: 'suffix', label: 'Suffix (e.g. +, %)', type: 'text' },
          { key: 'label', label: 'Label', type: 'text', required: true },
        ],
      },
    ],
  },
  {
    key: 'philosophy-marquee',
    name: 'Philosophy Marquee',
    icon: 'Sparkle',
    category: 'content',
    supportsDynamicSource: false,
    fields: [
      eyebrow(),
      heading(),
      { key: 'items', label: 'Principles', type: 'repeater', of: [{ key: 'text', label: 'Principle', type: 'text', required: true }] },
    ],
  },
  {
    key: 'process-steps',
    name: 'Process Steps',
    icon: 'Milestone',
    category: 'content',
    supportsDynamicSource: true,
    dynamicKinds: ['entries'],
    fields: [eyebrow(), heading(), paragraph('intro', 'Intro text')],
  },
  {
    key: 'testimonials-slider',
    name: 'Testimonials Slider',
    icon: 'Quote',
    category: 'content',
    supportsDynamicSource: true,
    dynamicKinds: ['entries'],
    fields: [eyebrow(), heading(), paragraph('intro', 'Intro text'), { key: 'limit', label: 'Items to show (0 = all)', type: 'number', default: 8 }],
  },
  {
    key: 'team-grid',
    name: 'Team Grid',
    icon: 'Users',
    category: 'content',
    supportsDynamicSource: true,
    dynamicKinds: ['entries'],
    fields: [eyebrow(), heading(), paragraph('intro', 'Intro text'), { key: 'limit', label: 'Items to show (0 = all)', type: 'number', default: 4 }],
  },
  {
    key: 'cta',
    name: 'Call To Action',
    icon: 'Megaphone',
    category: 'content',
    supportsDynamicSource: false,
    fields: [eyebrow(), heading(), paragraph('body', 'Body text'), bgImage(), button('buttons', 'Buttons')],
  },
  {
    key: 'faq',
    name: 'FAQ',
    icon: 'HelpCircle',
    category: 'content',
    supportsDynamicSource: true,
    dynamicKinds: ['entries'],
    fields: [eyebrow(), heading(), paragraph('intro', 'Intro text')],
  },
  {
    key: 'logo-slider',
    name: 'Logo / Client Slider',
    icon: 'BadgeCheck',
    category: 'content',
    supportsDynamicSource: true,
    dynamicKinds: ['entries'],
    fields: [heading()],
  },
  {
    key: 'awards-grid',
    name: 'Awards & Recognition',
    icon: 'Award',
    category: 'content',
    supportsDynamicSource: false,
    fields: [
      eyebrow(),
      {
        key: 'items',
        label: 'Awards',
        type: 'repeater',
        of: [
          { key: 'title', label: 'Award title', type: 'text', required: true },
          { key: 'source', label: 'Awarded by', type: 'text' },
        ],
      },
    ],
  },
  {
    key: 'blog-grid',
    name: 'Blog Grid',
    icon: 'Newspaper',
    category: 'content',
    supportsDynamicSource: true,
    dynamicKinds: ['posts'],
    fields: [eyebrow(), heading(), paragraph('intro', 'Intro text'), { key: 'limit', label: 'Posts to show', type: 'number', default: 3 }, button('cta', 'View-all button (optional)')],
  },
  {
    key: 'contact-info',
    name: 'Contact Information',
    icon: 'MapPin',
    category: 'content',
    supportsDynamicSource: false,
    fields: [eyebrow(), heading(), { key: 'showMap', label: 'Show Google Map embed', type: 'boolean', default: true }],
  },
  {
    key: 'contact-form',
    name: 'Contact Form',
    icon: 'Mail',
    category: 'forms',
    supportsDynamicSource: false,
    fields: [heading(), paragraph('intro', 'Intro text'), { key: 'formKey', label: 'Form', type: 'text', default: 'contact-main', helpText: 'Key of the Form document to render' }],
  },
  {
    key: 'gallery',
    name: 'Gallery',
    icon: 'Images',
    category: 'media',
    supportsDynamicSource: false,
    fields: [
      heading(),
      { key: 'images', label: 'Images', type: 'gallery' },
      { key: 'columns', label: 'Columns', type: 'select', options: [{ label: '2', value: '2' }, { label: '3', value: '3' }, { label: '4', value: '4' }], default: '3' },
    ],
  },
  {
    key: 'rich-text',
    name: 'Custom Rich Text',
    icon: 'Type',
    category: 'content',
    supportsDynamicSource: false,
    fields: [{ key: 'body', label: 'Content', type: 'richtext' }],
  },
];

export const COMPONENT_DEFINITIONS_BY_KEY = Object.fromEntries(COMPONENT_DEFINITIONS.map((def) => [def.key, def]));

export function getComponentDefinition(key) {
  return COMPONENT_DEFINITIONS_BY_KEY[key] || null;
}
