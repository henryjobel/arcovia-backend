import { z } from 'zod';

/**
 * Shared field-definition shape used by both the (static) component/section
 * registry and the (DB-driven) ContentType field lists. One shape → one
 * generic SchemaForm renders every editor in the admin panel.
 * Mirrors docs/02-DATABASE-SCHEMAS.md §5.7 / §8.1 fieldDefSchema.
 */
export const FIELD_TYPES = [
  'text',
  'textarea',
  'richtext',
  'number',
  'boolean',
  'media',
  'gallery',
  'link',
  'select',
  'color',
  'icon',
  'date',
  'repeater',
  'reference', // async select of Entries of another content type
  'taxonomy', // async select of Category slugs for a given taxonomy
];

export const fieldOptionSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

export const fieldDefSchema = z.lazy(() =>
  z.object({
    key: z.string().min(1),
    label: z.string().min(1),
    type: z.enum(FIELD_TYPES),
    required: z.boolean().optional().default(false),
    translatable: z.boolean().optional().default(false),
    options: z.array(fieldOptionSchema).optional(), // for `select`
    of: z.array(fieldDefSchema).optional(), // for `repeater` — nested row shape
    refContentType: z.string().optional(), // for `reference`
    taxonomy: z.string().optional(), // for `taxonomy`
    default: z.any().optional(),
    placeholder: z.string().optional(),
    helpText: z.string().optional(),
    order: z.number().optional(),
  })
);
