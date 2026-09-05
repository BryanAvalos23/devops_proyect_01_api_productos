import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

type ValidationTarget = 'body' | 'query' | 'params';

export const validate =
  (schema: AnyZodObject, target: ValidationTarget = 'body') =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[target]);
      // Reasignamos con los valores ya "coeridos" (ej: page como number)
      (req as unknown as Record<ValidationTarget, unknown>)[target] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(422).json({
          error: 'ValidationError',
          details: err.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        });
        return;
      }
      next(err);
    }
  };
