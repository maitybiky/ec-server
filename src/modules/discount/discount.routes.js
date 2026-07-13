import { Router } from 'express';
import { discountController } from './discount.controller.js';
import {
  createRuleSchema,
  updateRuleSchema,
  ruleIdSchema,
} from './discount.validator.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import {
  verifyAccessToken,
  requireAdmin,
} from '../../shared/middlewares/auth.middleware.js';

export const discountRoutes = Router();

discountRoutes.use(verifyAccessToken, requireAdmin);

discountRoutes.get('/', discountController.listRules);
discountRoutes.post('/', validate(createRuleSchema), discountController.createRule);
discountRoutes.patch('/:id', validate(updateRuleSchema), discountController.updateRule);
discountRoutes.delete('/:id', validate(ruleIdSchema), discountController.deleteRule);
