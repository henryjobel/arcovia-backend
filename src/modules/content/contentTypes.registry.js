/**
 * Static registry of content types (services, portfolio, team, testimonials,
 * process steps, FAQ) — same rationale as modules/components/registry.js:
 * the *shape* of each type is fixed code, the *entries* are 100% DB-driven.
 * One generic Entry model + admin ContentListPage/ContentEditPage serve all
 * of them (see plan decision #4).
 */

const text = (key, label, extra = {}) => ({ key, label, type: 'text', ...extra });
const textarea = (key, label) => ({ key, label, type: 'textarea' });
const richtext = (key, label) => ({ key, label, type: 'richtext' });
const media = (key, label) => ({ key, label, type: 'media' });

export const CONTENT_TYPES = [
  {
    key: 'service',
    name: 'Services',
    singularName: 'Service',
    icon: 'Sofa',
    hasSlug: true,
    hasSeo: true,
    hasDetailPage: true,
    hasTaxonomy: false,
    orderable: true,
    fields: [
      { key: 'icon', label: 'Icon', type: 'icon' },
      media('image', 'Thumbnail image'),
      media('bannerImage', 'Banner image (detail page)'),
      textarea('shortDescription', 'Short description'),
      richtext('description', 'Full description'),
      { key: 'features', label: 'Features', type: 'repeater', of: [text('text', 'Feature')] },
      { key: 'gallery', label: 'Gallery', type: 'gallery' },
      {
        key: 'cta',
        label: 'CTA button',
        type: 'repeater',
        of: [text('label', 'Button text'), { key: 'link', label: 'Link', type: 'link' }],
      },
    ],
  },
  {
    key: 'project',
    name: 'Portfolio',
    singularName: 'Project',
    icon: 'GalleryHorizontal',
    hasSlug: true,
    hasSeo: true,
    hasDetailPage: true,
    hasTaxonomy: 'project',
    orderable: true,
    fields: [
      { key: 'category', label: 'Category', type: 'taxonomy', taxonomy: 'project' },
      text('client', 'Client name'),
      text('location', 'Project location'),
      { key: 'projectDate', label: 'Project date', type: 'date' },
      textarea('shortDescription', 'Short description'),
      media('featuredImage', 'Featured image'),
      { key: 'gallery', label: 'Project gallery', type: 'gallery' },
      { key: 'beforeImage', label: 'Before image (optional)', type: 'media' },
      { key: 'afterImage', label: 'After image (optional)', type: 'media' },
      { key: 'servicesProvided', label: 'Services provided', type: 'repeater', of: [text('text', 'Service')] },
      richtext('overview', 'Full case-study overview'),
      richtext('challenge', 'The challenge'),
      richtext('solution', 'The solution'),
      richtext('results', 'The results'),
      {
        key: 'cta',
        label: 'CTA button',
        type: 'repeater',
        of: [text('label', 'Button text'), { key: 'link', label: 'Link', type: 'link' }],
      },
    ],
  },
  {
    key: 'team-member',
    name: 'Team',
    singularName: 'Team Member',
    icon: 'Users',
    hasSlug: false,
    hasSeo: false,
    hasDetailPage: false,
    hasTaxonomy: false,
    orderable: true,
    fields: [
      media('photo', 'Profile image'),
      text('designation', 'Position / designation'),
      textarea('shortBio', 'Short biography'),
      richtext('fullBio', 'Full biography'),
      text('email', 'Email'),
      text('phone', 'Phone'),
      {
        key: 'socialLinks',
        label: 'Social media links',
        type: 'repeater',
        of: [
          {
            key: 'platform',
            label: 'Platform',
            type: 'select',
            options: [
              { label: 'Instagram', value: 'Instagram' },
              { label: 'Facebook', value: 'Facebook' },
              { label: 'LinkedIn', value: 'LinkedIn' },
              { label: 'Twitter', value: 'Twitter' },
              { label: 'YouTube', value: 'YouTube' },
              { label: 'GitHub', value: 'GitHub' },
            ],
          },
          text('url', 'URL'),
        ],
      },
      { key: 'skills', label: 'Skills / specialties', type: 'repeater', of: [text('text', 'Skill')] },
    ],
  },
  {
    key: 'testimonial',
    name: 'Testimonials',
    singularName: 'Testimonial',
    icon: 'Quote',
    hasSlug: false,
    hasSeo: false,
    hasDetailPage: false,
    hasTaxonomy: false,
    orderable: true,
    fields: [
      text('authorName', 'Customer name', { required: true }),
      media('authorPhoto', 'Customer photo'),
      text('companyOrDesignation', 'Company / designation'),
      textarea('quote', 'Review content'),
      { key: 'rating', label: 'Rating (1-5)', type: 'number', default: 5 },
      { key: 'relatedService', label: 'Related service', type: 'reference', refContentType: 'service' },
    ],
  },
  {
    key: 'process-step',
    name: 'Process Steps',
    singularName: 'Process Step',
    icon: 'Milestone',
    hasSlug: false,
    hasSeo: false,
    hasDetailPage: false,
    hasTaxonomy: false,
    orderable: true,
    fields: [text('title', 'Title', { required: true }), textarea('description', 'Description'), { key: 'icon', label: 'Icon', type: 'icon' }],
  },
  {
    key: 'faq',
    name: 'FAQ',
    singularName: 'FAQ Item',
    icon: 'HelpCircle',
    hasSlug: false,
    hasSeo: false,
    hasDetailPage: false,
    hasTaxonomy: false,
    orderable: true,
    fields: [text('question', 'Question', { required: true }), richtext('answer', 'Answer')],
  },
];

export const CONTENT_TYPES_BY_KEY = Object.fromEntries(CONTENT_TYPES.map((t) => [t.key, t]));

export function getContentType(key) {
  return CONTENT_TYPES_BY_KEY[key] || null;
}
