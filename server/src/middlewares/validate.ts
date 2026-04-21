import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';

/**
 * Validate request body/query/params against a Zod schema
 */
export const validate = (schema: ZodObject<any>) => {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                next(error);
            } else {
                next(error);
            }
        }
    };
};