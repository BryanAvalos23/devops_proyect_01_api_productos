import { Request, Response } from 'express';
import { CategoryModel } from '../models/category.model';
import { NotFoundError } from '../utils/AppError';

export const CategoryController = {
  async list(_req: Request, res: Response): Promise<void> {
    const categories = await CategoryModel.findAll();
    res.json({ data: categories });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const category = await CategoryModel.findById(req.params.id);
    if (!category) throw new NotFoundError(`Categoría ${req.params.id} no encontrada`);
    res.json({ data: category });
  },

  async create(req: Request, res: Response): Promise<void> {
    const category = await CategoryModel.create(req.body);
    res.status(201).json({ data: category });
  },

  async update(req: Request, res: Response): Promise<void> {
    const updated = await CategoryModel.update(req.params.id, req.body);
    if (!updated) throw new NotFoundError(`Categoría ${req.params.id} no encontrada`);
    res.json({ data: updated });
  },

  async remove(req: Request, res: Response): Promise<void> {
    const deleted = await CategoryModel.remove(req.params.id);
    if (!deleted) throw new NotFoundError(`Categoría ${req.params.id} no encontrada`);
    res.status(204).send();
  },
};
