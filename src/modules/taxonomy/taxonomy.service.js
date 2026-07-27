import { Category } from './category.model.js';
import { NotFoundError, ConflictError, BusinessRuleError } from '../../core/errors/AppError.js';
import { slugify } from '../../core/utils/slugify.js';
import { Entry } from '../content/entry.model.js';

export const listCategories = (taxonomy) => Category.find({ taxonomy, deletedAt: null }).sort('order name').lean();

export const createCategory = async ({ taxonomy, name, slug }) => {
  const finalSlug = slug || slugify(name);
  if (await Category.exists({ taxonomy, slug: finalSlug })) throw new ConflictError('A category with this slug already exists');
  const count = await Category.countDocuments({ taxonomy, deletedAt: null });
  return Category.create({ taxonomy, name, slug: finalSlug, order: count });
};

export const updateCategory = async (id, data) => {
  const category = await Category.findById(id);
  if (!category || category.deletedAt) throw new NotFoundError('Category');
  if (data.slug && data.slug !== category.slug) {
    if (await Category.exists({ taxonomy: category.taxonomy, slug: data.slug, _id: { $ne: id } })) {
      throw new ConflictError('A category with this slug already exists');
    }
    category.slug = data.slug;
  }
  if (data.name !== undefined) category.name = data.name;
  await category.save();
  return category;
};

export const deleteCategory = async (id) => {
  const category = await Category.findById(id);
  if (!category || category.deletedAt) throw new NotFoundError('Category');
  const inUse = await Entry.countDocuments({ 'data.category': category.slug, deletedAt: null });
  if (inUse) throw new BusinessRuleError(`${inUse} item(s) still use this category. Reassign them first.`);
  category.deletedAt = new Date();
  await category.save();
};

export const reorderCategories = async (order) => {
  await Promise.all(order.map(({ id, order: pos }) => Category.updateOne({ _id: id }, { order: pos })));
};
