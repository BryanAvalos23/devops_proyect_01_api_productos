import { z } from 'zod';

export const createProductSchema = z.object({
  sku: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  price: z.number().nonnegative(),
  currency: z.string().length(3).optional(),
  stock: z.number().int().nonnegative().optional(),
  category_id: z.string().uuid().nullable().optional(),
  // "attributes" es intencionalmente libre: permite modelar cualquier tipo
  // de producto (talla, color, ISBN, voltaje, etc.) sin tocar el esquema.
  attributes: z.record(z.string(), z.unknown()).optional(),
  is_active: z.boolean().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  category_id: z.string().uuid().optional(),
  search: z.string().max(200).optional(),
  is_active: z.coerce.boolean().optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(1)
    .max(140)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug debe ser kebab-case (ej: ropa-deportiva)'),
  description: z.string().max(1000).optional(),
  parent_id: z.string().uuid().nullable().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const uuidParamSchema = z.object({
  id: z.string().uuid('id debe ser un UUID válido'),
});
