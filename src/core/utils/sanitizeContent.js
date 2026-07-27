import { sanitizeRichHtml } from './sanitizeHtml.js';

/**
 * Walks a fieldDef[] (section props, content-type entry data, etc.) and
 * sanitizes every `richtext` value it finds — including inside repeater rows —
 * so admin-authored rich text can never persist a raw <script>/onerror payload.
 * This is the actual XSS boundary for Mixed/arbitrary props; Zod only checks
 * shape, not HTML safety.
 */
export function sanitizeFieldData(fields, data) {
  if (!data || typeof data !== 'object') return data;
  const out = Array.isArray(data) ? [...data] : { ...data };

  for (const field of fields || []) {
    const value = out[field.key];
    if (value === undefined) continue;

    if (field.type === 'richtext' && typeof value === 'string') {
      out[field.key] = sanitizeRichHtml(value);
    } else if (field.type === 'repeater' && Array.isArray(value)) {
      out[field.key] = value.map((row) => sanitizeFieldData(field.of || [], row));
    }
  }
  return out;
}

/** Mirrors Frontend/src/admin/cms/SchemaForm.jsx defaultValueForFields — seeds a brand-new entry/page's data. */
export function defaultValueForFields(fields) {
  const data = {};
  for (const f of fields || []) {
    if (f.default !== undefined) data[f.key] = f.default;
    else if (f.type === 'repeater' || f.type === 'gallery') data[f.key] = [];
    else if (f.type === 'boolean') data[f.key] = false;
    else if (f.type === 'select') data[f.key] = f.options?.[0]?.value ?? '';
    else data[f.key] = '';
  }
  return data;
}
