import { Request, Response, NextFunction } from 'express';
import { authService } from '../services';
import { AuthRequest } from '../middlewares';
import { sendSuccess, sendCreated } from '../utils/response';
import { User } from '@/models/User';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

    // ═══ CHỨC NĂNG MỚI: ĐĂNG NHẬP BẰNG GOOGLE ═══
    async googleLogin(req: Request, res: Response, next: NextFunction) {
        try {
            const { credential } = req.body;
            if (!credential) {
                res.status(400).json({ success: false, message: 'Thiếu token xác thực từ Google' });
                return;
            }

            // 1. Nhờ Google xác minh Token
            const ticket = await googleClient.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID,
            });

            const payload = ticket.getPayload();
            if (!payload || !payload.email) {
                res.status(400).json({ success: false, message: 'Token Google không hợp lệ' });
                return;
            }

            const { email, name, picture } = payload;

            // 2. Kiểm tra xem Email này đã tồn tại trong hệ thống chưa
            let user = await User.findOne({ email });

            // 3. Nếu chưa có tài khoản -> Tự động đăng ký mới luôn
            if (!user) {
                user = await User.create({
                    email,
                    displayName: name || 'Người dùng Google',
                    avatar: picture,
                    password: Math.random().toString(36).slice(-10), // Random mật khẩu vì login bằng GG
                    isVerified: true, // Google đã xác thực email rồi
                });
            }

            // 4. Tạo JWT Token của app ShuttleSync
            const accessToken = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET as string,
                { expiresIn: '1d' }
            );

            const refreshToken = jwt.sign(
                { id: user._id },
                process.env.JWT_REFRESH_SECRET as string,
                { expiresIn: '7d' }
            );

            // 5. Trả kết quả về cho Frontend
            sendSuccess(res, {
                user,
                accessToken,
                refreshToken
            }, 'Đăng nhập Google thành công');

        } catch (error) {
            console.error('Lỗi Google Login Backend:', error);
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

    async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.userId;

            if (!userId) {
                res.status(401).json({ success: false, message: 'Không tìm thấy ID người dùng' });
                return;
            }

            const user = await User.findById(userId).select('-password');

            if (!user) {
                res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
                return;
            }

            sendSuccess(res, user, 'Lấy thông tin cá nhân thành công');
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