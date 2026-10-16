import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';

/**
 * Validate request body/query/params against a Zod schema
 */
export const validate = (schema: ZodObject<any>) => {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
        try {
            const parsed = await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            if (parsed.body !== undefined) req.body = parsed.body;
            if (parsed.query !== undefined) req.query = parsed.query;
            if (parsed.params !== undefined) req.params = parsed.params;
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
