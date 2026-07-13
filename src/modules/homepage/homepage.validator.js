import { z } from 'zod';

const card = z.object({
  title: z.string().min(1).max(80),
  subtitle: z.string().max(120).default(''),
  image: z.string().url().or(z.literal('')),
});

export const updateHomepageSchema = z.object({
  body: z
    .object({
      badge: z.string().max(60).optional(),
      titleLine1: z.string().max(80).optional(),
      titleLine2: z.string().max(80).optional(),
      subtitle: z.string().max(100).optional(),
      description: z.string().max(300).optional(),
      ctaText: z.string().max(40).optional(),
      heroImage: z.string().url().or(z.literal('')).optional(),
      cards: z.array(card).max(2).optional(),
    })
    .refine((b) => Object.keys(b).length > 0, 'Nothing to update'),
});
