import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { config } from '../config';

export const errorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    // Zod validation error
    if (err instanceof ZodError) {
        const errors: Record<string, string[]> = {};
        err.issues.forEach((e) => {
            const path = e.path.join('.');
            if (!errors[path]) errors[path] = [];
            errors[path].push(e.message);
        });

        res.status(400).json({
            success: false,
            message: 'Dữ liệu không hợp lệ',
            errors,
        });
        return;
    }

    // Custom API error
    if (err instanceof ApiError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors,
        });
        return;
    }

    // Mongoose validation error
    if (err instanceof mongoose.Error.ValidationError) {
        const errors: Record<string, string[]> = {};
        Object.entries(err.errors).forEach(([key, val]) => {
            errors[key] = [val.message];
        });

        res.status(400).json({
            success: false,
            message: 'Dữ liệu không hợp lệ',
            errors,
        });
        return;
    }

    // Mongoose duplicate key error
    if (err.name === 'MongoServerError' && (err as any).code === 11000) {
        const field = Object.keys((err as any).keyValue)[0];
        res.status(409).json({
            success: false,
            message: `${field} đã tồn tại`,
        });
        return;
    }

    // Mongoose cast error (invalid ObjectId)
    if (err instanceof mongoose.Error.CastError) {
        res.status(400).json({
            success: false,
            message: 'ID không hợp lệ',
        });
        return;
    }

    // Unknown error
    logger.error('Unhandled error:', err);

    res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống',
        ...(config.isProduction ? {} : { stack: err.stack }),
    });
};

/**
 * 404 handler for unknown routes
 */
export const notFoundHandler = (_req: Request, res: Response): void => {
    res.status(404).json({
        success: false,
        message: 'Endpoint không tồn tại',
    });
};