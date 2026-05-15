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

export const authenticate = async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        let token = req.cookies?.accessToken;
        if (!token && req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            throw ApiError.unauthorized('Token không hợp lệ hoặc không tồn tại');
        }

        const decoded = jwt.verify(token, config.jwt.accessSecret) as any;

        const currentUserId = decoded.id || decoded.userId;
        const user = await User.findById(currentUserId).select('status role banInfo').lean();

        if (!user) {
            throw ApiError.unauthorized('Tài khoản không tồn tại');
        }

        if (user.status === UserStatus.BANNED) {
            if (user.banInfo?.expiresAt && new Date(user.banInfo.expiresAt) < new Date()) {
                await User.findByIdAndUpdate(currentUserId, {
                    status: UserStatus.ACTIVE,
                    $unset: { banInfo: 1 },
                });
            } else {
                throw ApiError.forbidden(
                    `Tài khoản đã bị cấm${user.banInfo?.reason ? `: ${user.banInfo.reason}` : ''}`
                );
            }
        }

        req.userId = currentUserId;
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

export const optionalAuth = async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        let token = req.cookies?.accessToken;

        if (!token && req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next();
        }

        const decoded = jwt.verify(token, config.jwt.accessSecret) as any;

        req.userId = decoded.id || decoded.userId;
        req.userRole = decoded.role;
        req.userEmail = decoded.email;
        next();
    } catch {
        next();
    }
};

export const authorize = (...roles: UserRole[]) => {
    return (req: AuthRequest, _res: Response, next: NextFunction): void => {
        if (!req.userRole || !roles.includes(req.userRole)) {
            next(ApiError.forbidden('Bạn không có quyền thực hiện hành động này'));
            return;
        }
        next();
    };
};

export const requireAdmin = authorize(UserRole.ADMIN);
export const requireCourtOwner = authorize(UserRole.COURT_OWNER, UserRole.ADMIN);