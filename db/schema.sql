-- ============================================================
-- Products microservice - PostgreSQL schema
-- Diseñado para soportar cualquier tipo de producto/categoría
-- mediante atributos dinámicos en JSONB (estilo ecommerce)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- para gen_random_uuid()

-- Categorías (soporta jerarquía: categoría padre/hija)
CREATE TABLE IF NOT EXISTS categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(120) NOT NULL,
    slug            VARCHAR(140) NOT NULL UNIQUE,
    description     TEXT,
    parent_id       UUID NULL REFERENCES categories(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Productos: los campos "fijos" son los comunes a cualquier producto.
-- "attributes" (JSONB) permite modelar campos específicos por tipo de
-- producto (talla, color, voltaje, ISBN, etc.) sin cambiar el esquema.
CREATE TABLE IF NOT EXISTS products (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku             VARCHAR(64) NOT NULL UNIQUE,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    price           NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    currency        CHAR(3) NOT NULL DEFAULT 'USD',
    stock           INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    category_id     UUID NULL REFERENCES categories(id) ON DELETE SET NULL,
    attributes      JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products USING GIN (to_tsvector('spanish', name));
CREATE INDEX IF NOT EXISTS idx_products_attributes ON products USING GIN (attributes);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- Trigger genérico para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_categories_updated_at ON categories;
CREATE TRIGGER trg_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Datos semilla de ejemplo
INSERT INTO categories (name, slug, description) VALUES
    ('Electrónica', 'electronica', 'Dispositivos electrónicos en general'),
    ('Ropa', 'ropa', 'Prendas de vestir')
ON CONFLICT (slug) DO NOTHING;
