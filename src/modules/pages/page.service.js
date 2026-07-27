import { Page } from './page.model.js';
import { PageRevision } from './pageRevision.model.js';
import { BaseRepository } from '../../core/repositories/BaseRepository.js';
import { NotFoundError, ConflictError, BusinessRuleError } from '../../core/errors/AppError.js';
import { uniqueSlug } from '../../core/utils/slugify.js';
import { getComponentDefinition } from '../components/registry.js';
import { sanitizeFieldData } from '../../core/utils/sanitizeContent.js';
import { resolveSections } from './sectionResolver.js';

const repo = new BaseRepository(Page, { resourceName: 'Page' });
const MAX_REVISIONS = 10;

export const listPages = (query) =>
  repo.list(query, {
    searchFields: ['title', 'slug'],
    allowedFilters: ['type', 'status'],
    baseFilter: { deletedAt: null },
    defaultSort: 'title',
  });

export const getPage = (id) => repo.findByIdOrFail(id);

/** Strip any raw HTML out of richtext props before it ever reaches the database. */
function sanitizeSections(sections) {
  return (sections || []).map((section) => {
    const def = getComponentDefinition(section.type);
    return { ...section, props: def ? sanitizeFieldData(def.fields, section.props || {}) : section.props };
  });
}

export const createPage = async (data, actorId) => {
  if (await Page.exists({ slug: data.slug })) throw new ConflictError('A page with this slug already exists');
  return Page.create({
    title: data.title,
    slug: data.slug,
    template: data.template || 'default',
    draft: { sections: [] },
    published: { sections: [], version: 0 },
    status: 'draft',
    createdBy: actorId,
    updatedBy: actorId,
  });
};

export const updatePage = async (id, data, actorId) => {
  const page = await repo.findByIdOrFail(id);

  if (data.slug && data.slug !== page.slug) {
    if (page.systemKey) throw new BusinessRuleError('System pages cannot be renamed/reslugged');
    if (await Page.exists({ slug: data.slug, _id: { $ne: id } })) throw new ConflictError('A page with this slug already exists');
    // NOTE(M8): once the SEO/redirects module exists, auto-create a 301 Redirect
    // from the old slug to the new one here, before overwriting page.slug.
    page.slug = data.slug;
  }
  if (data.title !== undefined) page.title = data.title;
  if (data.template !== undefined) page.template = data.template;
  if (data.seo !== undefined) page.seo = data.seo;
  if (data.sections !== undefined) {
    page.draft.sections = sanitizeSections(data.sections);
    page.hasUnpublishedChanges = true;
  }
  page.updatedBy = actorId;
  await page.save();
  return page;
};

export const deletePage = async (id) => {
  const page = await repo.findByIdOrFail(id);
  if (page.systemKey) throw new BusinessRuleError('System pages cannot be deleted');
  page.deletedAt = new Date();
  await page.save();
};

export const duplicatePage = async (id, actorId) => {
  const page = await repo.findByIdOrFail(id);
  const slug = await uniqueSlug(Page, `${page.title}-copy`);
  return Page.create({
    title: `${page.title} (Copy)`,
    slug,
    type: 'standard',
    template: page.template,
    draft: { sections: page.draft.sections },
    published: { sections: [], version: 0 },
    seo: page.seo,
    status: 'draft',
    createdBy: actorId,
    updatedBy: actorId,
  });
};

export const reorderSections = async (id, order) => {
  const page = await repo.findByIdOrFail(id);
  const orderByUid = new Map(order.map((o) => [o.uid, o.order]));
  const reordered = page.draft.sections
    .map((s) => {
      const plain = s.toObject();
      return { ...plain, order: orderByUid.has(s.uid) ? orderByUid.get(s.uid) : plain.order };
    })
    .sort((a, b) => a.order - b.order);
  page.draft.sections = reordered;
  page.hasUnpublishedChanges = true;
  await page.save();
  return page;
};

export const publishPage = async (id, actorId) => {
  const page = await repo.findByIdOrFail(id);

  if (page.published.version > 0) {
    await PageRevision.create({
      page: page._id,
      version: page.published.version,
      title: page.title,
      sections: page.published.sections,
      seo: page.seo,
      publishedAt: page.published.at,
      publishedBy: page.published.by,
    });
    const total = await PageRevision.countDocuments({ page: page._id });
    if (total > MAX_REVISIONS) {
      const stale = await PageRevision.find({ page: page._id }).sort('createdAt').limit(total - MAX_REVISIONS).select('_id');
      await PageRevision.deleteMany({ _id: { $in: stale.map((r) => r._id) } });
    }
  }

  page.published = { sections: page.draft.sections, version: page.published.version + 1, at: new Date(), by: actorId };
  page.status = 'published';
  page.hasUnpublishedChanges = false;
  await page.save();
  return page;
};

export const unpublishPage = async (id) => {
  const page = await repo.findByIdOrFail(id);
  page.status = 'unpublished';
  await page.save();
  return page;
};

export const listRevisions = async (id) => {
  await repo.findByIdOrFail(id);
  return PageRevision.find({ page: id }).sort('-createdAt').limit(MAX_REVISIONS).lean();
};

export const restoreRevision = async (id, revisionId) => {
  const page = await repo.findByIdOrFail(id);
  const revision = await PageRevision.findOne({ _id: revisionId, page: id });
  if (!revision) throw new NotFoundError('Revision');
  page.draft.sections = revision.sections;
  page.hasUnpublishedChanges = true;
  await page.save();
  return page;
};

/** Admin draft preview — same shape as public delivery, but from `draft`. */
export const getAdminPreview = async (id) => {
  const page = await repo.findByIdOrFail(id);
  const sections = await resolveSections(page.draft.sections);
  return { title: page.title, slug: page.slug, sections, seo: page.seo, isDraftPreview: true };
};

/** Public delivery — published content only, never draft. */
export const getPublicPageBySlug = async (slug) => {
  const page = await Page.findOne({ slug, deletedAt: null });
  if (!page || page.status !== 'published') throw new NotFoundError('Page');
  const sections = await resolveSections(page.published.sections);
  return { title: page.title, slug: page.slug, sections, seo: page.seo };
};

/** Metadata for static system routes (About/Contact/Blog) that don't render CMS sections. */
export const getPublicPageMetaBySlug = async (slug) => {
  const page = await Page.findOne({
    slug,
    deletedAt: null,
    $or: [{ status: 'published' }, { systemKey: { $exists: true, $ne: null } }],
  })
    .select('title slug seo updatedAt')
    .lean();
  if (!page) throw new NotFoundError('Page');
  return page;
};
