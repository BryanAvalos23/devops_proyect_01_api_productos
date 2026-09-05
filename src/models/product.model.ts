import { pool } from '../config/db';
import { Product, CreateProductInput, UpdateProductInput, ProductQuery } from '../types/product.types';

// NOTA DE SEGURIDAD: todas las queries usan placeholders ($1, $2, ...) del
// driver `pg`, nunca interpolación de strings. Esto elimina el riesgo de
// SQL injection sin importar qué envíe el cliente.

export const ProductModel = {
  async findAll(query: ProductQuery): Promise<{ items: Product[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: unknown[] = [];

    if (query.category_id) {
      values.push(query.category_id);
      conditions.push(`category_id = $${values.length}`);
    }
    if (typeof query.is_active === 'boolean') {
      values.push(query.is_active);
      conditions.push(`is_active = $${values.length}`);
    }
    if (query.search) {
      values.push(`%${query.search}%`);
      conditions.push(`name ILIKE $${values.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM products ${whereClause}`,
      values
    );

    values.push(limit);
    values.push(offset);

    const dataResult = await pool.query<Product>(
      `SELECT * FROM products ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    return { items: dataResult.rows, total: Number(countResult.rows[0]?.count ?? 0) };
  },

  async findById(id: string): Promise<Product | null> {
    const result = await pool.query<Product>('SELECT * FROM products WHERE id = $1', [id]);
    return result.rows[0] ?? null;
  },

  async findBySku(sku: string): Promise<Product | null> {
    const result = await pool.query<Product>('SELECT * FROM products WHERE sku = $1', [sku]);
    return result.rows[0] ?? null;
  },

  async create(input: CreateProductInput): Promise<Product> {
    const result = await pool.query<Product>(
      `INSERT INTO products (sku, name, description, price, currency, stock, category_id, attributes, is_active)
       VALUES ($1, $2, $3, $4, COALESCE($5, 'USD'), COALESCE($6, 0), $7, COALESCE($8, '{}'::jsonb), COALESCE($9, true))
       RETURNING *`,
      [
        input.sku,
        input.name,
        input.description ?? null,
        input.price,
        input.currency ?? null,
        input.stock ?? null,
        input.category_id ?? null,
        input.attributes ? JSON.stringify(input.attributes) : null,
        input.is_active ?? null,
      ]
    );
    return result.rows[0];
  },

  async update(id: string, input: UpdateProductInput): Promise<Product | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    const fieldMap: Record<string, unknown> = {
      sku: input.sku,
      name: input.name,
      description: input.description,
      price: input.price,
      currency: input.currency,
      stock: input.stock,
      category_id: input.category_id,
      is_active: input.is_active,
    };

    for (const [key, value] of Object.entries(fieldMap)) {
      if (value !== undefined) {
        values.push(value);
        fields.push(`${key} = $${values.length}`);
      }
    }

    if (input.attributes !== undefined) {
      values.push(JSON.stringify(input.attributes));
      fields.push(`attributes = $${values.length}`);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const result = await pool.query<Product>(
      `UPDATE products SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );
    return result.rows[0] ?? null;
  },

  async remove(id: string): Promise<boolean> {
    const result = await pool.query('DELETE FROM products WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },
};
