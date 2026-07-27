import { listPublicEntries } from '../content/entry.service.js';
import { listPublicPosts } from '../blog/post.service.js';

/**
 * Resolves a page's sections for public/preview delivery: filters disabled
 * sections, sorts by order, and injects live items for sections whose
 * `dynamicSource.kind` is 'entries' (Content Engine) or 'posts' (Blog).
 */
export async function resolveSections(sections) {
  const visible = (sections || [])
    .filter((s) => s.enabled !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return Promise.all(
    visible.map(async (section) => {
      const plain = typeof section.toObject === 'function' ? section.toObject() : section;
      const kind = plain.dynamicSource?.kind;
      if (!kind || kind === 'none') return plain;

      if (kind === 'entries') {
        if (!plain.dynamicSource.contentType) return { ...plain, items: [] };
        const items = await listPublicEntries(plain.dynamicSource.contentType, {
          filters: plain.dynamicSource.filters || {},
          limit: plain.dynamicSource.limit || 0,
        }).catch(() => []); // unknown/typo'd content type key — degrade to empty, never 500 the page
        return { ...plain, items };
      }
      if (kind === 'posts') {
        const { data } = await listPublicPosts({ limit: plain.dynamicSource.limit || 0 }).catch(() => ({ data: [] }));
        return { ...plain, items: data };
      }
      return plain;
    })
  );
}
