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
        const user = await User.findById(currentUserId).select('status role banInfo +tokenVersion').lean();
        if (!user || (decoded.tokenVersion || 0) !== (user.tokenVersion || 0)) throw ApiError.unauthorized('Account does not exist');
        const { status, banInfo, role } = user;

        if (status === UserStatus.BANNED) {
            if (banInfo?.expiresAt && new Date(banInfo.expiresAt) < new Date()) {
                // Background update to remove ban
                await User.findByIdAndUpdate(currentUserId, {
                    status: UserStatus.ACTIVE,
                    $unset: { banInfo: 1 },
                }).catch(err => console.error("Lỗi xóa ban tự động", err));
            } else {
                throw ApiError.unauthorized(
                    `Tài khoản đã bị cấm${banInfo?.reason ? `: ${banInfo.reason}` : ''}`
                );
            }
        }

        req.userId = currentUserId;
        req.userRole = role;
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

        const user = await User.findById(decoded.id || decoded.userId).select('status role +tokenVersion').lean();
        if (!user || user.status !== UserStatus.ACTIVE || (decoded.tokenVersion || 0) !== (user.tokenVersion || 0)) return next();
        req.userId = decoded.id || decoded.userId;
        req.userRole = user.role;
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