import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { validate } from '../middlewares/validate';
import { asyncHandler } from '../utils/asyncHandler';
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  uuidParamSchema,
} from '../utils/validation';

const router = Router();

router.get('/', validate(productQuerySchema, 'query'), asyncHandler(ProductController.list));
router.get('/:id', validate(uuidParamSchema, 'params'), asyncHandler(ProductController.getById));
router.post('/', validate(createProductSchema, 'body'), asyncHandler(ProductController.create));
router.put(
  '/:id',
  validate(uuidParamSchema, 'params'),
  validate(updateProductSchema, 'body'),
  asyncHandler(ProductController.update)
);
router.delete('/:id', validate(uuidParamSchema, 'params'), asyncHandler(ProductController.remove));

export default router;
