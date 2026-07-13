import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const addressFieldsSchema = z.object({
  fullName: z.string().min(2).max(100),
  phone: z.string().min(7).max(20),
  line1: z.string().min(3).max(200),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  postalCode: z.string().min(3).max(12),
});

export const createAddressSchema = z.object({
  body: addressFieldsSchema,
});

export const addressIdSchema = z.object({
  params: z.object({ id: objectId }),
});
