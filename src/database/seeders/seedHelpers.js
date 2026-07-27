import { genUid } from '../../core/utils/genUid.js';

export const img = (id, w = 1200, h = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=82`;
export const mediaRef = (id, w, h, alt = '') => ({ assetId: null, url: img(id, w, h), alt });
export const internalLink = (url) => ({ type: 'internal', url, newTab: false });
export { genUid };
