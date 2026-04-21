import { Request, Response, NextFunction } from 'express';
import { authService } from '../services';
import { AuthRequest } from '../middlewares';
import { sendSuccess, sendCreated } from '../utils/response';

class AuthController {
    async register(req: Request, res: Response, next: NextFunction) {
        try {
            const { user, tokens } = await authService.register(req.body);
            sendCreated(res, { user, ...tokens }, 'Đăng ký thành công');
        } catch (error) {
            next(error);
        }
    }

    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { user, tokens } = await authService.login(req.body.email, req.body.password);
            sendSuccess(res, { user, ...tokens }, 'Đăng nhập thành công');
        } catch (error) {
            next(error);
        }
    }

    async refreshToken(req: Request, res: Response, next: NextFunction) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                res.status(400).json({ success: false, message: 'Refresh token là bắt buộc' });
                return;
            }
            const tokens = await authService.refreshToken(refreshToken);
            sendSuccess(res, tokens, 'Làm mới token thành công');
        } catch (error) {
            next(error);
        }
    }

    async logout(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            await authService.logout(req.userId!, req.body.refreshToken);
            sendSuccess(res, null, 'Đăng xuất thành công');
        } catch (error) {
            next(error);
        }
    }

    async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            await authService.changePassword(
                req.userId!,
                req.body.currentPassword,
                req.body.newPassword
            );
            sendSuccess(res, null, 'Đổi mật khẩu thành công');
        } catch (error) {
            next(error);
        }
    }
}

export const authController = new AuthController();