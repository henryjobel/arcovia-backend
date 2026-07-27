import { Post } from './post.model.js';
import { Category } from '../taxonomy/category.model.js';
import { BaseRepository } from '../../core/repositories/BaseRepository.js';
import { NotFoundError, ConflictError } from '../../core/errors/AppError.js';
import { uniqueSlug } from '../../core/utils/slugify.js';
import { sanitizeRichHtml } from '../../core/utils/sanitizeHtml.js';

const repo = new BaseRepository(Post, { resourceName: 'Post' });
const WORDS_PER_MINUTE = 200;

const computeReadingTime = (html) => {
  const words = (html || '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
};

export const listPosts = (query) =>
  repo.list(query, {
    searchFields: ['title', 'excerpt'],
    allowedFilters: ['status', 'isFeatured', 'categories', 'tags'],
    baseFilter: { deletedAt: null },
    defaultSort: '-createdAt',
    populate: [{ path: 'author', select: 'name' }, { path: 'categories', select: 'name slug' }],
  });

export const getPost = (id) => repo.findByIdOrFail(id, { populate: [{ path: 'categories', select: 'name slug' }] });

export const createPost = async (data, actorId) => {
  const slug = data.slug || (await uniqueSlug(Post, data.title));
  if (data.slug && (await Post.exists({ slug: data.slug }))) throw new ConflictError('A post with this slug already exists');
  return Post.create({
    title: data.title,
    slug,
    author: actorId,
    status: 'draft',
    createdBy: actorId,
    updatedBy: actorId,
  });
};

export const updatePost = async (id, patch, actorId) => {
  const post = await repo.findByIdOrFail(id);

  if (patch.slug && patch.slug !== post.slug) {
    if (await Post.exists({ slug: patch.slug, _id: { $ne: id } })) throw new ConflictError('A post with this slug already exists');
    post.slug = patch.slug;
  }
  if (patch.title !== undefined) post.title = patch.title;
  if (patch.excerpt !== undefined) post.excerpt = patch.excerpt;
  if (patch.contentHtml !== undefined) {
    post.contentHtml = sanitizeRichHtml(patch.contentHtml);
    post.readingTimeMinutes = computeReadingTime(post.contentHtml);
  }
  if (patch.featuredImage !== undefined) post.featuredImage = patch.featuredImage;
  if (patch.categories !== undefined) post.categories = patch.categories;
  if (patch.tags !== undefined) post.tags = patch.tags;
  if (patch.isFeatured !== undefined) post.isFeatured = patch.isFeatured;
  if (patch.seo !== undefined) post.seo = patch.seo;
  post.updatedBy = actorId;
  await post.save();
  return post;
};

export const deletePost = async (id) => {
  const post = await repo.findByIdOrFail(id);
  post.deletedAt = new Date();
  await post.save();
};

export const duplicatePost = async (id, actorId) => {
  const post = await repo.findByIdOrFail(id);
  const slug = await uniqueSlug(Post, `${post.title}-copy`);
  return Post.create({
    title: `${post.title} (Copy)`,
    slug,
    excerpt: post.excerpt,
    contentHtml: post.contentHtml,
    featuredImage: post.featuredImage,
    author: post.author,
    categories: post.categories,
    tags: post.tags,
    readingTimeMinutes: post.readingTimeMinutes,
    seo: post.seo,
    status: 'draft',
    createdBy: actorId,
    updatedBy: actorId,
  });
};

export const publishPost = async (id) => {
  const post = await repo.findByIdOrFail(id);
  post.status = 'published';
  post.publishedAt = post.publishedAt || new Date();
  post.scheduledAt = undefined;
  await post.save();
  return post;
};

export const unpublishPost = async (id) => {
  const post = await repo.findByIdOrFail(id);
  post.status = 'draft';
  await post.save();
  return post;
};

export const schedulePost = async (id, scheduledAt) => {
  const post = await repo.findByIdOrFail(id);
  post.status = 'scheduled';
  post.scheduledAt = new Date(scheduledAt);
  await post.save();
  return post;
};

/* ── Public delivery ── */

const publicVisibilityFilter = () => ({
  deletedAt: null,
  $or: [{ status: 'published' }, { status: 'scheduled', scheduledAt: { $lte: new Date() } }],
});

export const listPublicPosts = async ({ category, tag, search, featured, limit = 0, page = 1 } = {}) => {
  const filter = publicVisibilityFilter();
  if (category) {
    // `category` arrives as a slug (what the public blog UI links with), not an ObjectId.
    const categoryDoc = await Category.findOne({ taxonomy: 'blog', slug: category }).select('_id').lean();
    filter.categories = categoryDoc ? categoryDoc._id : null; // no match → filter yields zero results, not everything
  }
  if (tag) filter.tags = tag;
  if (featured) filter.isFeatured = true;
  if (search) filter.$text = { $search: search };

  const perPage = limit || 20;
  let query = Post.find(filter)
    .sort('-publishedAt -createdAt')
    .populate('author', 'name')
    .populate('categories', 'name slug')
    .skip((page - 1) * perPage);
  if (limit) query = query.limit(limit);
  const [data, total] = await Promise.all([query.lean(), Post.countDocuments(filter)]);
  return { data, total };
};

export const getPublicPostBySlug = async (slug) => {
  const post = await Post.findOneAndUpdate({ slug, ...publicVisibilityFilter() }, { $inc: { views: 1 } }, { new: true })
    .populate('author', 'name')
    .populate('categories', 'name slug')
    .lean();
  if (!post) throw new NotFoundError('Post');
  return post;
};

export const listPublicTags = () => Post.distinct('tags', publicVisibilityFilter());
