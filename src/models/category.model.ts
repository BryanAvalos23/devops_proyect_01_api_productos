import { pool } from '../config/db';
import { Category } from '../types/product.types';

export interface CreateCategoryInput {
  name: string;
  slug: string;
  description?: string;
  parent_id?: string | null;
}
export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export const CategoryModel = {
  async findAll(): Promise<Category[]> {
    const result = await pool.query<Category>('SELECT * FROM categories ORDER BY name ASC');
    return result.rows;
  },

  async findById(id: string): Promise<Category | null> {
    const result = await pool.query<Category>('SELECT * FROM categories WHERE id = $1', [id]);
    return result.rows[0] ?? null;
  },

  async create(input: CreateCategoryInput): Promise<Category> {
    const result = await pool.query<Category>(
      `INSERT INTO categories (name, slug, description, parent_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [input.name, input.slug, input.description ?? null, input.parent_id ?? null]
    );
    return result.rows[0];
  },

  async update(id: string, input: UpdateCategoryInput): Promise<Category | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) {
        values.push(value);
        fields.push(`${key} = $${values.length}`);
      }
    }
    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const result = await pool.query<Category>(
      `UPDATE categories SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );
    return result.rows[0] ?? null;
  },

  async remove(id: string): Promise<boolean> {
    const result = await pool.query('DELETE FROM categories WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },
};
