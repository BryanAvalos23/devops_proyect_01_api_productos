# products-api

Microservicio de catálogo de productos para práctica de DevOps (pensado para
desplegarse luego en Kubernetes). Node.js + Express + TypeScript + PostgreSQL.

## Características

- CRUD completo de **productos** y **categorías**.
- Modelo de producto flexible: el campo `attributes` (JSONB) permite guardar
  cualquier campo específico de un tipo de producto (talla, color, voltaje,
  ISBN, etc.) sin cambiar el esquema — pensado para un catálogo tipo ecommerce.
- Validación de entrada con **Zod** (rechaza payloads inválidos antes de tocar la DB).
- Queries **parametrizadas** con `pg` (sin concatenar strings → sin SQL injection).
- Seguridad HTTP: `helmet`, `cors` restringido por origen, `express-rate-limit`.
- Manejo centralizado de errores (incluye traducción de errores de PostgreSQL
  como violaciones de unicidad/FK a respuestas HTTP claras).
- Logging estructurado con `pino`.
- **Observabilidad con OpenTelemetry ya instrumentada** (ver sección abajo).
- Tests de integración con `jest` + `supertest` (mockeando la capa de datos).
- **Sin Dockerfile ni docker-compose** (a propósito — se gestionan aparte).

## OpenTelemetry (trazas + métricas)

El servicio ya viene instrumentado con OpenTelemetry (`src/tracing.ts`):
auto-instrumentación de HTTP, Express y PostgreSQL vía OTLP/HTTP. **No
necesitas tocar código**, solo configurar en `.env` el endpoint de tu
collector (Jaeger, Grafana Tempo/Alloy, un OpenTelemetry Collector propio,
etc.):

```bash
OTEL_ENABLED=true
OTEL_SERVICE_NAME=products-api
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318   # tu collector, puerto OTLP/HTTP
OTEL_EXPORTER_OTLP_HEADERS=                          # opcional, "key=value,key2=value2"
```

- Si `OTEL_ENABLED=false` (o no está seteado y `NODE_ENV=test`), el SDK ni
  siquiera se inicializa — así los tests corren limpios y sin overhead.
- Si el collector no está disponible, el servicio **no se cae**: los envíos
  de spans/métricas simplemente fallan/reintentan en segundo plano.
- Cada request queda trazada de punta a punta: entra por Express, pasa por
  el handler, y las queries a PostgreSQL aparecen como spans hijos — útil
  para ver, por ejemplo, qué endpoint está lento por una query específica.
- El shutdown (`SIGTERM`/`SIGINT`, como el que envía Kubernetes al bajar un
  pod) hace un flush ordenado de lo pendiente antes de salir.

Para probarlo rápido en local, cualquier collector que escuche OTLP/HTTP en
el puerto 4318 sirve (por ejemplo, el `otel/opentelemetry-collector` oficial,
o directamente Jaeger con soporte OTLP habilitado).

## Requisitos

- Node.js 20+
- PostgreSQL 14+

## Configuración

```bash
cp .env.example .env
# edita .env con tus credenciales de PostgreSQL
```

## Instalación y migración de base de datos

```bash
npm install
npm run migrate   # aplica db/schema.sql contra la base configurada en .env
```

## Desarrollo

```bash
npm run dev
```

## Build y producción

```bash
npm run build
npm start
```

## Tests

```bash
npm test
```

## Lint

```bash
npm run lint
```

## Endpoints

| Método | Ruta                   | Descripción                     |
|--------|------------------------|----------------------------------|
| GET    | /health                | Estado del servicio y la DB      |
| GET    | /api/products          | Listar productos (paginado, filtros: `category_id`, `search`, `is_active`) |
| GET    | /api/products/:id      | Obtener un producto              |
| POST   | /api/products          | Crear producto                   |
| PUT    | /api/products/:id      | Actualizar producto               |
| DELETE | /api/products/:id      | Eliminar producto                 |
| GET    | /api/categories        | Listar categorías                 |
| GET    | /api/categories/:id    | Obtener categoría                 |
| POST   | /api/categories        | Crear categoría                   |
| PUT    | /api/categories/:id    | Actualizar categoría              |
| DELETE | /api/categories/:id    | Eliminar categoría                |

### Ejemplo: crear un producto

```json
POST /api/products
{
  "sku": "SHIRT-001",
  "name": "Camiseta DevOps",
  "price": 19.99,
  "stock": 50,
  "category_id": "uuid-de-categoria",
  "attributes": { "talla": "M", "color": "negro" }
}
```
