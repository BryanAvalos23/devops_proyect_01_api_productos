import { Request, Response, NextFunction, RequestHandler } from 'express';

// Evita repetir try/catch en cada controlador async.
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
