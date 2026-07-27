import { FilterXSS } from 'xss';

/**
 * SVG is XML that browsers can execute as active content (inline <script>,
 * on* handlers, javascript: URIs) — unlike raster formats it is NOT safe to
 * accept as-is. This strips everything except a safe drawing-only subset
 * before the file ever reaches Cloudinary.
 */
const svgFilter = new FilterXSS({
  whiteList: {
    svg: ['xmlns', 'viewbox', 'width', 'height', 'fill', 'stroke', 'version', 'aria-hidden', 'role'],
    g: ['fill', 'stroke', 'transform', 'opacity'],
    path: ['d', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'opacity', 'transform'],
    circle: ['cx', 'cy', 'r', 'fill', 'stroke', 'opacity', 'transform'],
    ellipse: ['cx', 'cy', 'rx', 'ry', 'fill', 'stroke', 'opacity', 'transform'],
    rect: ['x', 'y', 'width', 'height', 'rx', 'ry', 'fill', 'stroke', 'opacity', 'transform'],
    line: ['x1', 'y1', 'x2', 'y2', 'stroke', 'stroke-width', 'transform'],
    polygon: ['points', 'fill', 'stroke', 'transform'],
    polyline: ['points', 'fill', 'stroke', 'transform'],
    defs: [],
    lineargradient: ['id', 'x1', 'y1', 'x2', 'y2', 'gradientunits'],
    radialgradient: ['id', 'cx', 'cy', 'r', 'gradientunits'],
    stop: ['offset', 'stop-color', 'stop-opacity'],
    title: [],
    desc: [],
  },
  stripIgnoreTag: true, // drops <script>, <foreignObject>, <image> (external refs), event-handler-bearing tags entirely
  stripIgnoreTagBody: ['script', 'style'],
  onIgnoreTagAttr(tag, name) {
    // belt-and-braces: xss already strips on* via whitelist, but explicitly
    // nuke any lingering event handler or javascript: href even on kept tags
    if (/^on/i.test(name)) return '';
    return undefined;
  },
});

export const sanitizeSvgBuffer = (buffer) => Buffer.from(svgFilter.process(buffer.toString('utf8')), 'utf8');
