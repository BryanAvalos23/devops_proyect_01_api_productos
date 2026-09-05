import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.name, message: err.message });
    return;
  }

  // Errores de PostgreSQL comunes (constraint violations) sin filtrar detalles internos
  const pgErr = err as { code?: string; detail?: string };
  if (pgErr.code === '23505') {
    res.status(409).json({ error: 'ConflictError', message: 'Registro duplicado (violación de unicidad)' });
    return;
  }
  if (pgErr.code === '23503') {
    res.status(409).json({ error: 'ConflictError', message: 'Referencia inválida (llave foránea)' });
    return;
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'InternalServerError', message: 'Ocurrió un error inesperado' });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: 'NotFoundError', message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}
