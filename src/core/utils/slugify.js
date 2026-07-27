export const slugify = (text) =>
  String(text)
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'item';

/** Generate a slug unique within a collection (optionally scoped by extra filter). */
export const uniqueSlug = async (model, text, { scope = {}, excludeId } = {}) => {
  const base = slugify(text);
  let candidate = base;
  let i = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const query = { slug: candidate, ...scope };
    if (excludeId) query._id = { $ne: excludeId };
    if (!(await model.exists(query))) return candidate;
    candidate = `${base}-${++i}`;
  }
};
