import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { UserRole, UserStatus } from '@shuttle-sync/shared';

describe('Auth & JWT Utilities', () => {
    const secret = 'test_jwt_secret_key_123456';

    it('tạo và verify JWT token hợp lệ', () => {
        const payload = {
            id: 'user_123456',
            role: UserRole.USER,
            status: UserStatus.ACTIVE,
            email: 'athlete@shuttlesync.vn',
        };

        const token = jwt.sign(payload, secret, { expiresIn: '1h' });
        expect(token).toBeDefined();

        const decoded = jwt.verify(token, secret) as any;
        expect(decoded.id).toBe(payload.id);
        expect(decoded.role).toBe(UserRole.USER);
        expect(decoded.status).toBe(UserStatus.ACTIVE);
    });

    it('báo lỗi khi token đã hết hạn', () => {
        const payload = { id: 'user_expired', role: UserRole.USER };
        const token = jwt.sign(payload, secret, { expiresIn: '0s' });

        expect(() => {
            jwt.verify(token, secret);
        }).toThrow(jwt.TokenExpiredError);
    });

    it('báo lỗi khi verify với secret key không khớp', () => {
        const token = jwt.sign({ id: 'user_tampered' }, secret);

        expect(() => {
            jwt.verify(token, 'wrong_secret_key');
        }).toThrow(jwt.JsonWebTokenError);
    });

    describe('Role Authorization Helper', () => {
        const checkRoleAllowed = (userRole: UserRole, allowedRoles: UserRole[]): boolean => {
            return allowedRoles.includes(userRole);
        };

        it('chỉ cho phép ADMIN truy cập tính năng admin', () => {
            expect(checkRoleAllowed(UserRole.ADMIN, [UserRole.ADMIN])).toBe(true);
            expect(checkRoleAllowed(UserRole.USER, [UserRole.ADMIN])).toBe(false);
            expect(checkRoleAllowed(UserRole.COURT_OWNER, [UserRole.ADMIN])).toBe(false);
        });

        it('cho phép cả COURT_OWNER và ADMIN quản lý cơ sở sân', () => {
            const ownerRoles = [UserRole.COURT_OWNER, UserRole.ADMIN];
            expect(checkRoleAllowed(UserRole.COURT_OWNER, ownerRoles)).toBe(true);
            expect(checkRoleAllowed(UserRole.ADMIN, ownerRoles)).toBe(true);
            expect(checkRoleAllowed(UserRole.USER, ownerRoles)).toBe(false);
        });
    });
});
