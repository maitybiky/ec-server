import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const addItemSchema = z.object({
  body: z.object({
    productId: objectId,
    quantity: z.number().int().min(1).max(999),
  }),
});

export const updateItemSchema = z.object({
  params: z.object({ productId: objectId }),
  body: z.object({
    quantity: z.number().int().min(1).max(999),
  }),
});

export const removeItemSchema = z.object({
  params: z.object({ productId: objectId }),
});
