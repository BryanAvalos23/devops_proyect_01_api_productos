import { Request, Response } from 'express';
import { ProductModel } from '../models/product.model';
import { NotFoundError, ConflictError } from '../utils/AppError';
import { ProductQuery, CreateProductInput, UpdateProductInput } from '../types/product.types';

export const ProductController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as ProductQuery;
    const { items, total } = await ProductModel.findAll(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    res.json({
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const product = await ProductModel.findById(req.params.id);
    if (!product) throw new NotFoundError(`Producto ${req.params.id} no encontrado`);
    res.json({ data: product });
  },

  async create(req: Request, res: Response): Promise<void> {
    const input = req.body as CreateProductInput;
    const existing = await ProductModel.findBySku(input.sku);
    if (existing) throw new ConflictError(`Ya existe un producto con sku "${input.sku}"`);
    const product = await ProductModel.create(input);
    res.status(201).json({ data: product });
  },

  async update(req: Request, res: Response): Promise<void> {
    const input = req.body as UpdateProductInput;
    const updated = await ProductModel.update(req.params.id, input);
    if (!updated) throw new NotFoundError(`Producto ${req.params.id} no encontrado`);
    res.json({ data: updated });
  },

  async remove(req: Request, res: Response): Promise<void> {
    const deleted = await ProductModel.remove(req.params.id);
    if (!deleted) throw new NotFoundError(`Producto ${req.params.id} no encontrado`);
    res.status(204).send();
  },
};
