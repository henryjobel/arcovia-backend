import { Page } from '../pages/page.model.js';
import { Post } from '../blog/post.model.js';
import { Entry } from '../content/entry.model.js';
import { NotFoundError } from '../../core/errors/AppError.js';

const PAGE_ROUTES = {
  home: '/',
  services: '/services',
  portfolio: '/portfolio',
  about: '/about',
  process: '/process',
  testimonials: '/testimonials',
  team: '/team',
  contact: '/contact',
  blog: '/blog',
};

const entryPath = (entry) => {
  if (entry.typeKey === 'service') return `/services/${entry.slug}`;
  if (entry.typeKey === 'project') return `/portfolio/${entry.slug}`;
  return `/${entry.typeKey}/${entry.slug}`;
};

const matches = (item, search) => {
  if (!search) return true;
  const needle = search.toLowerCase();
  return `${item.title} ${item.slug || ''} ${item.path}`.toLowerCase().includes(needle);
};

export const listSeoTargets = async ({ kind, search } = {}) => {
  const [pages, posts, entries] = await Promise.all([
    !kind || kind === 'page'
      ? Page.find({ deletedAt: null }).select('title slug systemKey status seo updatedAt').sort('title').lean()
      : [],
    !kind || kind === 'post'
      ? Post.find({ deletedAt: null }).select('title slug status seo updatedAt').sort('-publishedAt -createdAt').lean()
      : [],
    !kind || kind === 'entry'
      ? Entry.find({ deletedAt: null, slug: { $type: 'string' } }).select('title slug typeKey status seo updatedAt').sort('typeKey title').lean()
      : [],
  ]);

  return [
    ...pages.map((page) => ({
      ...page,
      kind: 'page',
      kindLabel: 'Page',
      path: PAGE_ROUTES[page.systemKey] || `/${page.slug}`,
    })),
    ...posts.map((post) => ({
      ...post,
      kind: 'post',
      kindLabel: 'Blog post',
      path: `/blog/${post.slug}`,
    })),
    ...entries.map((entry) => ({
      ...entry,
      kind: 'entry',
      kindLabel: entry.typeKey === 'service' ? 'Service' : entry.typeKey === 'project' ? 'Project' : 'Content',
      path: entryPath(entry),
    })),
  ].filter((item) => matches(item, search));
};

const modelFor = (kind) => ({ page: Page, post: Post, entry: Entry }[kind]);

export const updateSeoTarget = async (kind, id, seo, actorId) => {
  const Model = modelFor(kind);
  const item = await Model.findOne({ _id: id, deletedAt: null });
  if (!item) throw new NotFoundError('SEO target');
  item.seo = seo;
  item.updatedBy = actorId;
  await item.save();
  return item;
};
