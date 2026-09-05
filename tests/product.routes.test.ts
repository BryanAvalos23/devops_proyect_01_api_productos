import request from 'supertest';
import { createApp } from '../src/app';

// Mockeamos el pool de PostgreSQL para probar rutas/controladores/validación
// sin necesitar una base de datos real (tests unitarios rápidos y aislados).
jest.mock('../src/config/db', () => ({
  pool: { query: jest.fn(), on: jest.fn() },
  checkDbConnection: jest.fn().mockResolvedValue(true),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { pool } = require('../src/config/db');

const app = createApp();

const sampleProduct = {
  id: '11111111-1111-1111-1111-111111111111',
  sku: 'SKU-001',
  name: 'Camiseta DevOps',
  description: 'Camiseta con logo de Kubernetes',
  price: '19.99',
  currency: 'USD',
  stock: 10,
  category_id: null,
  attributes: { talla: 'M', color: 'negro' },
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /health', () => {
  it('responde 200 cuando la base de datos está disponible', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('GET /api/products', () => {
  it('devuelve una lista paginada de productos', async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ count: '1' }] })
      .mockResolvedValueOnce({ rows: [sampleProduct] });

    const res = await request(app).get('/api/products');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination.total).toBe(1);
  });
});

describe('GET /api/products/:id', () => {
  it('devuelve 422 si el id no es un UUID válido', async () => {
    const res = await request(app).get('/api/products/no-es-un-uuid');
    expect(res.status).toBe(422);
    expect(res.body.error).toBe('ValidationError');
  });

  it('devuelve 404 si el producto no existe', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get(`/api/products/${sampleProduct.id}`);
    expect(res.status).toBe(404);
  });

  it('devuelve 200 con el producto cuando existe', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [sampleProduct] });
    const res = await request(app).get(`/api/products/${sampleProduct.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.sku).toBe('SKU-001');
  });
});

describe('POST /api/products', () => {
  it('rechaza payloads inválidos (price negativo)', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ sku: 'X', name: 'Producto', price: -5 });
    expect(res.status).toBe(422);
  });

  it('rechaza sku duplicado con 409', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [sampleProduct] }); // findBySku
    const res = await request(app).post('/api/products').send({
      sku: 'SKU-001',
      name: 'Otro nombre',
      price: 10,
    });
    expect(res.status).toBe(409);
  });

  it('crea un producto válido y devuelve 201', async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [] }) // findBySku -> no existe
      .mockResolvedValueOnce({ rows: [sampleProduct] }); // insert

    const res = await request(app).post('/api/products').send({
      sku: 'SKU-001',
      name: 'Camiseta DevOps',
      price: 19.99,
      attributes: { talla: 'M', color: 'negro' },
    });

    expect(res.status).toBe(201);
    expect(res.body.data.sku).toBe('SKU-001');
  });
});

describe('DELETE /api/products/:id', () => {
  it('devuelve 404 si no existía', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({ rowCount: 0 });
    const res = await request(app).delete(`/api/products/${sampleProduct.id}`);
    expect(res.status).toBe(404);
  });

  it('devuelve 204 si se eliminó correctamente', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({ rowCount: 1 });
    const res = await request(app).delete(`/api/products/${sampleProduct.id}`);
    expect(res.status).toBe(204);
  });
});
