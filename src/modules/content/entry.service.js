import { Entry } from './entry.model.js';
import { BaseRepository } from '../../core/repositories/BaseRepository.js';
import { NotFoundError, ConflictError, BusinessRuleError } from '../../core/errors/AppError.js';
import { uniqueSlug } from '../../core/utils/slugify.js';
import { getContentType } from './contentTypes.registry.js';
import { sanitizeFieldData, defaultValueForFields } from '../../core/utils/sanitizeContent.js';

const repo = new BaseRepository(Entry, { resourceName: 'Entry' });

function assertType(typeKey) {
  const type = getContentType(typeKey);
  if (!type) throw new NotFoundError('Content type');
  return type;
}

export const listEntries = (typeKey, query) => {
  assertType(typeKey);
  return repo.list(query, {
    searchFields: ['title'],
    allowedFilters: ['status', 'featured'],
    baseFilter: { typeKey, deletedAt: null },
    defaultSort: 'order title',
  });
};

export const getEntry = (id) => repo.findByIdOrFail(id);

export const createEntry = async (typeKey, data, actorId) => {
  const type = assertType(typeKey);
  const slug = type.hasSlug ? data.slug || (await uniqueSlug(Entry, data.title, { scope: { typeKey } })) : undefined;
  if (type.hasSlug && data.slug && (await Entry.exists({ typeKey, slug: data.slug }))) {
    throw new ConflictError('An item with this slug already exists');
  }
  const count = await Entry.countDocuments({ typeKey, deletedAt: null });
  return Entry.create({
    typeKey,
    title: data.title,
    slug,
    data: defaultValueForFields(type.fields),
    order: count,
    status: 'draft',
    createdBy: actorId,
    updatedBy: actorId,
  });
};

export const updateEntry = async (id, patch, actorId) => {
  const entry = await repo.findByIdOrFail(id);
  const type = assertType(entry.typeKey);

  if (patch.slug && patch.slug !== entry.slug) {
    if (await Entry.exists({ typeKey: entry.typeKey, slug: patch.slug, _id: { $ne: id } })) {
      throw new ConflictError('An item with this slug already exists');
    }
    entry.slug = patch.slug;
  }
  if (patch.title !== undefined) entry.title = patch.title;
  if (patch.featured !== undefined) entry.featured = patch.featured;
  if (patch.seo !== undefined) entry.seo = patch.seo;
  if (patch.sections !== undefined) entry.sections = patch.sections;
  if (patch.data !== undefined) entry.data = sanitizeFieldData(type.fields, { ...entry.data, ...patch.data });
  entry.updatedBy = actorId;
  await entry.save();
  return entry;
};

export const deleteEntry = async (id) => {
  const entry = await repo.findByIdOrFail(id);
  entry.deletedAt = new Date();
  await entry.save();
};

export const duplicateEntry = async (id, actorId) => {
  const entry = await repo.findByIdOrFail(id);
  const type = assertType(entry.typeKey);
  const slug = type.hasSlug ? await uniqueSlug(Entry, `${entry.title}-copy`, { scope: { typeKey: entry.typeKey } }) : undefined;
  const count = await Entry.countDocuments({ typeKey: entry.typeKey, deletedAt: null });
  return Entry.create({
    typeKey: entry.typeKey,
    title: `${entry.title} (Copy)`,
    slug,
    data: entry.data,
    sections: entry.sections,
    seo: entry.seo,
    order: count,
    status: 'draft',
    createdBy: actorId,
    updatedBy: actorId,
  });
};

export const reorderEntries = async (typeKey, order) => {
  assertType(typeKey);
  await Promise.all(order.map(({ id, order: pos }) => Entry.updateOne({ _id: id, typeKey }, { order: pos })));
};

export const publishEntry = async (id) => {
  const entry = await repo.findByIdOrFail(id);
  entry.status = 'published';
  await entry.save();
  return entry;
};

export const unpublishEntry = async (id) => {
  const entry = await repo.findByIdOrFail(id);
  entry.status = 'draft';
  await entry.save();
  return entry;
};

/** Used by both the public REST endpoint and Page dynamicSource resolution (M3's sectionResolver). */
export const listPublicEntries = async (typeKey, { filters = {}, limit = 0 } = {}) => {
  assertType(typeKey);
  const filter = { typeKey, status: 'published', deletedAt: null };
  if (filters.featured) filter.featured = true;
  if (filters.category) filter['data.category'] = filters.category;
  let query = Entry.find(filter).sort('order title');
  if (limit) query = query.limit(limit);
  return query.lean();
};

export const getPublicEntryBySlug = async (typeKey, slug) => {
  assertType(typeKey);
  const entry = await Entry.findOne({ typeKey, slug, status: 'published', deletedAt: null }).lean();
  if (!entry) throw new NotFoundError('Item');
  return entry;
};
