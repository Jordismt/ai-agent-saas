import { z } from "zod";

const nullableText = (max) => z.string().trim().max(max).nullable().optional();

const nullableUrl = z
  .union([z.string().trim().url(), z.literal(""), z.null()])
  .optional()
  .transform((value) => {
    if (value === "" || value === undefined) {
      return null;
    }

    return value;
  });

const nullableEmail = z
  .union([z.string().trim().email(), z.literal(""), z.null()])
  .optional()
  .transform((value) => {
    if (value === "" || value === undefined) {
      return null;
    }

    return value;
  });

export const updateBusinessPublicPageSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain only lowercase letters, numbers and hyphens"),

  published: z.boolean().default(false),

  headline: nullableText(150),
  description: nullableText(500),
  about: nullableText(3000),

  logoUrl: nullableUrl,
  coverImageUrl: nullableUrl,

  publicPhone: nullableText(50),
  publicEmail: nullableEmail,
  publicAddress: nullableText(300),

  instagramUrl: nullableUrl,
  facebookUrl: nullableUrl,
  tiktokUrl: nullableUrl,
  websiteUrl: nullableUrl,
  mapsUrl: nullableUrl,

  showServices: z.boolean().default(true),
  showTeam: z.boolean().default(true),
  showHours: z.boolean().default(true),
  showAbout: z.boolean().default(true),
  showContact: z.boolean().default(true),
});
