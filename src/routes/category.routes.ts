import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { validate } from '../middlewares/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { createCategorySchema, updateCategorySchema, uuidParamSchema } from '../utils/validation';

const router = Router();

router.get('/', asyncHandler(CategoryController.list));
router.get('/:id', validate(uuidParamSchema, 'params'), asyncHandler(CategoryController.getById));
router.post('/', validate(createCategorySchema, 'body'), asyncHandler(CategoryController.create));
router.put(
  '/:id',
  validate(uuidParamSchema, 'params'),
  validate(updateCategorySchema, 'body'),
  asyncHandler(CategoryController.update)
);
router.delete('/:id', validate(uuidParamSchema, 'params'), asyncHandler(CategoryController.remove));

export default router;
