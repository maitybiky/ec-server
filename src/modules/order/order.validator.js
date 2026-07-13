import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const placeOrderSchema = z.object({
  body: z.object({
    shippingAddress: z.object({
      fullName: z.string().min(2).max(100),
      phone: z.string().min(7).max(20),
      line1: z.string().min(3).max(200),
      city: z.string().min(2).max(100),
      state: z.string().min(2).max(100),
      postalCode: z.string().min(3).max(12),
    }),
  }),
});

export const listOrdersSchema = z.object({
  query: z.object({
    status: z.enum(['placed', 'completed', 'cancelled']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

export const orderIdSchema = z.object({
  params: z.object({ id: objectId }),
});

export const updateStatusSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    status: z.enum(['completed', 'cancelled']),
  }),
});

export const exportOrdersSchema = z.object({
  query: z.object({
    status: z.enum(['placed', 'completed', 'cancelled']).optional(),
  }),
});
