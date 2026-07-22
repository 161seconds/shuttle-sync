import { Request, Response, NextFunction } from 'express';
import NodeCache from 'node-cache';
import { logger } from '../utils/logger';

// TTL = 60 seconds mặc định
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

export const cacheMiddleware = (ttl: number) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Chỉ cache request GET
        if (req.method !== 'GET') {
            return next();
        }

        // Tạo key từ url (bao gồm query string)
        const key = `__express__${req.originalUrl || req.url}`;
        const cachedBody = cache.get(key);

        if (cachedBody) {
            logger.info(`[Cache HIT] ${key}`);
            return res.json(cachedBody);
        } else {
            // Override res.json để tự động lưu vào cache
            const originalJson = res.json.bind(res);
            res.json = (body: any) => {
                cache.set(key, body, ttl);
                return originalJson(body);
            };
            next();
        }
    };
};
