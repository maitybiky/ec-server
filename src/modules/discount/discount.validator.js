import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const configByType = {
  base_cart: z.object({ percent: z.number().min(0).max(100) }),
  quantity_threshold: z.object({
    threshold: z.number().int().min(1),
    percentPerThreshold: z.number().min(0).max(100),
  }),
  multi_category: z.object({
    minCategories: z.number().int().min(2),
    percent: z.number().min(0).max(100),
  }),
  max_cap: z.object({ maxPercent: z.number().min(0).max(100) }),
};

const ruleBody = z
  .object({
    type: z.enum(['base_cart', 'quantity_threshold', 'multi_category', 'max_cap']),
    name: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
    config: z.record(z.unknown()),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  })
  .superRefine((body, ctx) => {
    const schema = configByType[body.type];
    const result = schema.safeParse(body.config);
    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['config', ...issue.path],
          message: issue.message,
        });
      }
    }
  });

export const createRuleSchema = z.object({ body: ruleBody });

export const updateRuleSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      name: z.string().min(2).max(100).optional(),
      description: z.string().max(500).optional(),
      config: z.record(z.unknown()).optional(),
      isActive: z.boolean().optional(),
      sortOrder: z.number().int().optional(),
    })
    .refine((b) => Object.keys(b).length > 0, 'Nothing to update'),
});

export const ruleIdSchema = z.object({
  params: z.object({ id: objectId }),
});
