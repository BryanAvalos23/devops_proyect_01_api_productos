export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  stock: number;
  category_id: string | null;
  attributes: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProductInput {
  sku: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  stock?: number;
  category_id?: string | null;
  attributes?: Record<string, unknown>;
  is_active?: boolean;
}

export type UpdateProductInput = Partial<CreateProductInput>;

export interface ProductQuery {
  page?: number;
  limit?: number;
  category_id?: string;
  search?: string;
  is_active?: boolean;
}
