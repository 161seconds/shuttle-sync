import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole, UserStatus } from '@shuttle-sync/shared';
import { config } from '../config';
import { User } from '../models';
import { ApiError } from '../utils/ApiError';

export interface AuthRequest extends Request {
    userId?: string;
    userRole?: UserRole;
    userEmail?: string;
}

/**
 * Verify JWT access token and attach user info to request
 */
export const authenticate = async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            throw ApiError.unauthorized('Token không hợp lệ');
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, config.jwt.accessSecret) as {
            userId: string;
            role: UserRole;
            email: string;
        };

        // Check user still exists and is active
        const user = await User.findById(decoded.userId).select('status role banInfo').lean();
        if (!user) {
            throw ApiError.unauthorized('Tài khoản không tồn tại');
        }

        if (user.status === UserStatus.BANNED) {
            // Check if ban has expired
            if (user.banInfo?.expiresAt && new Date(user.banInfo.expiresAt) < new Date()) {
                await User.findByIdAndUpdate(decoded.userId, {
                    status: UserStatus.ACTIVE,
                    $unset: { banInfo: 1 },
                });
            } else {
                throw ApiError.forbidden(
                    `Tài khoản đã bị cấm${user.banInfo?.reason ? `: ${user.banInfo.reason}` : ''}`
                );
            }
        }

        req.userId = decoded.userId;
        req.userRole = user.role;
        req.userEmail = decoded.email;
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            next(ApiError.unauthorized('Token đã hết hạn'));
        } else if (error instanceof jwt.JsonWebTokenError) {
            next(ApiError.unauthorized('Token không hợp lệ'));
        } else {
            next(error);
        }
    }
};

/**
 * Optional auth - doesn't fail if no token, but attaches user if present
 */
export const optionalAuth = async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, config.jwt.accessSecret) as {
            userId: string;
            role: UserRole;
            email: string;
        };

        req.userId = decoded.userId;
        req.userRole = decoded.role;
        req.userEmail = decoded.email;
        next();
    } catch {
        // Token invalid/expired but that's OK for optional auth
        next();
    }
};

/**
 * Role-based authorization middleware factory
 */
export const authorize = (...roles: UserRole[]) => {
    return (req: AuthRequest, _res: Response, next: NextFunction): void => {
        if (!req.userRole || !roles.includes(req.userRole)) {
            next(ApiError.forbidden('Bạn không có quyền thực hiện hành động này'));
            return;
        }
        next();
    };
};

/**
 * Require admin role
 */
export const requireAdmin = authorize(UserRole.ADMIN);

/**
 * Require court owner or admin
 */
export const requireCourtOwner = authorize(UserRole.COURT_OWNER, UserRole.ADMIN);