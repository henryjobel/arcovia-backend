import mongoose from 'mongoose';
import { z } from 'zod';

/**
 * Shared SEO sub-document — embedded on Page, Entry, and Post (docs/02 §1.1
 * seoSchema, simplified: plain strings instead of TString since this project
 * has no multi-language requirement).
 */
export const seoMongooseSchema = new mongoose.Schema(
  {
    metaTitle: String,
    metaDescription: String,
    focusKeyword: String,
    keywords: [String],
    canonicalUrl: String,
    robots: {
      index: { type: Boolean, default: true },
      follow: { type: Boolean, default: true },
    },
    og: {
      title: String,
      description: String,
      image: String, // MediaAsset url snapshot (see MediaPicker toMediaRef)
    },
    twitter: {
      title: String,
      description: String,
      image: String,
    },
    schemaType: String,
    schemaJsonLd: mongoose.Schema.Types.Mixed,
    sitemap: {
      include: { type: Boolean, default: true },
      priority: { type: Number, min: 0, max: 1, default: 0.7 },
      changefreq: {
        type: String,
        enum: ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'],
        default: 'weekly',
      },
    },
  },
  { _id: false }
);

const mediaRefUrl = z.string().optional().or(z.literal(''));

export const seoZodSchema = z
  .object({
    metaTitle: z.string().max(70).optional(),
    metaDescription: z.string().max(200).optional(),
    focusKeyword: z.string().max(80).optional(),
    keywords: z.array(z.string().max(60)).max(20).optional(),
    canonicalUrl: z.string().max(300).optional(),
    robots: z.object({ index: z.boolean().optional(), follow: z.boolean().optional() }).optional(),
    og: z.object({ title: z.string().optional(), description: z.string().optional(), image: mediaRefUrl }).optional(),
    twitter: z.object({ title: z.string().optional(), description: z.string().optional(), image: mediaRefUrl }).optional(),
    schemaType: z.string().max(60).optional(),
    schemaJsonLd: z.any().optional(),
    sitemap: z
      .object({
        include: z.boolean().optional(),
        priority: z.number().min(0).max(1).optional(),
        changefreq: z.enum(['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never']).optional(),
      })
      .optional(),
  })
  .partial();
