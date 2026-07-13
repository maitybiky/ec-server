import { Router } from 'express';
import { addressController } from './address.controller.js';
import {
  createAddressSchema,
  addressIdSchema,
} from './address.validator.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import { verifyAccessToken } from '../../shared/middlewares/auth.middleware.js';

export const addressRoutes = Router();

addressRoutes.use(verifyAccessToken);

addressRoutes.get('/', addressController.list);
addressRoutes.post('/', validate(createAddressSchema), addressController.create);
addressRoutes.delete('/:id', validate(addressIdSchema), addressController.remove);
