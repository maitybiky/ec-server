import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const browseProductsSchema = z.object({
  query: z.object({
    category: objectId.optional(),
    ids: z
      .string()
      .regex(/^[0-9a-fA-F]{24}(,[0-9a-fA-F]{24})*$/, 'Invalid ids list')
      .optional(),
    search: z.string().max(200).optional(),
    sort: z.enum(['newest', 'price_asc', 'price_desc']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
    includeInactive: z.string().optional(),
  }),
});

export const productIdSchema = z.object({
  params: z.object({ id: objectId }),
});

// Multipart form fields arrive as strings — coerce numerics.
export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(200),
    description: z.string().max(5000).default(''),
    price: z.coerce.number().min(0),
    category: objectId,
    stock: z.coerce.number().int().min(0).default(0),
    status: z.enum(['active', 'inactive']).default('active'),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    name: z.string().min(2).max(200).optional(),
    description: z.string().max(5000).optional(),
    price: z.coerce.number().min(0).optional(),
    category: objectId.optional(),
    stock: z.coerce.number().int().min(0).optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
});

export const removeImageSchema = z.object({
  params: z.object({
    id: objectId,
    key: z.string().min(1),
  }),
});
