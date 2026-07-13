import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).max(60),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      name: z.string().min(2).max(60).optional(),
      isActive: z.boolean().optional(),
    })
    .refine((b) => Object.keys(b).length > 0, 'Nothing to update'),
});

export const categoryIdSchema = z.object({
  params: z.object({ id: objectId }),
});
