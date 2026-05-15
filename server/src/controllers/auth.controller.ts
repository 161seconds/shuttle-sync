import { Request, Response, NextFunction } from 'express';
import { authService } from '../services';
import { AuthRequest } from '../middlewares';
import { sendSuccess, sendCreated } from '../utils/response';
import { User } from '../models'; // Sửa lại đường dẫn model cho chuẩn
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { config } from '../config';

// ═══ HÀM TIỆN ÍCH CẤP COOKIE TỰ ĐỘNG NHẬN DIỆN MÔI TRƯỜNG ═══
const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
    const cookieOpts = {
        httpOnly: true,
        secure: false,
        sameSite: 'lax' as const,
        path: '/',
    };
    res.cookie('accessToken', accessToken, { ...cookieOpts, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 });
};

const clearAuthCookies = (res: Response) => {
    const cookieOpts = { httpOnly: true, secure: false, sameSite: 'lax' as const, path: '/' };
    res.clearCookie('accessToken', cookieOpts);
    res.clearCookie('refreshToken', cookieOpts);
};

// ═══ CẤU HÌNH GỬI MAIL ═══
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

class AuthController {
    async register(req: Request, res: Response, next: NextFunction) {
        try {
            const { user, tokens } = await authService.register(req.body);
            setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
            sendCreated(res, { user }, 'Đăng ký thành công');
        } catch (error) {
            next(error);
        }
    }

    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { user, tokens } = await authService.login(req.body.email, req.body.password);
            setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
            sendSuccess(res, { user }, 'Đăng nhập thành công');
        } catch (error) {
            next(error);
        }
    }

    // ═══ YÊU CẦU GỬI OTP ═══
    async requestOtp(req: Request, res: Response, next: NextFunction) {
        try {
            const { email } = req.body;
            if (!email) {
                res.status(400).json({ success: false, message: 'Vui lòng nhập email' });
                return;
            }

            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

            let user = await User.findOne({ email });
            if (!user) {
                user = await User.create({
                    email,
                    displayName: email.split('@')[0],
                    password: crypto.randomBytes(16).toString('hex'),
                    role: 'USER',
                });
            }

            await User.findByIdAndUpdate(user._id, { otpCode, otpExpires });

            await transporter.sendMail({
                from: '"ShuttleSync System" <no-reply@shuttlesync.com>',
                to: email,
                subject: 'Mã xác thực đăng nhập ShuttleSync',
                html: `
                    <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background: #f4f4f5; border-radius: 10px;">
                        <h2>Chào Vợt Thủ! 🏸</h2>
                        <p>Mã xác thực (OTP) của bạn là:</p>
                        <h1 style="color: #10b981; font-size: 32px; letter-spacing: 5px;">${otpCode}</h1>
                        <p style="color: #ef4444; font-size: 12px;">*Mã này sẽ hết hạn trong 5 phút. Vui lòng không chia sẻ cho ai.</p>
                    </div>
                `
            });

            sendSuccess(res, null, 'Đã gửi mã OTP đến email của bạn!');
        } catch (error) {
            console.error('Lỗi gửi mail OTP:', error);
            next(error);
        }
    }

    // ═══ XÁC NHẬN OTP ĐỂ ĐĂNG NHẬP ═══
    async verifyOtpLogin(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, otp } = req.body;
            if (!email || !otp) {
                res.status(400).json({ success: false, message: 'Thiếu email hoặc mã OTP' });
                return;
            }

            const user = await User.findOne({ email });
            if (!user) {
                res.status(404).json({ success: false, message: 'Tài khoản không tồn tại' });
                return;
            }

            const userAny = user as any;
            if (userAny.otpCode !== otp) {
                res.status(400).json({ success: false, message: 'Mã OTP không chính xác' });
                return;
            }
            if (userAny.otpExpires < new Date()) {
                res.status(400).json({ success: false, message: 'Mã OTP đã hết hạn' });
                return;
            }

            await User.findByIdAndUpdate(user._id, { $unset: { otpCode: 1, otpExpires: 1 } });

            const accessToken = jwt.sign({ id: user._id, role: user.role }, config.jwt.accessSecret, { expiresIn: '15m' });
            const refreshToken = jwt.sign({ id: user._id }, config.jwt.refreshSecret, { expiresIn: '7d' });

            setAuthCookies(res, accessToken, refreshToken);
            sendSuccess(res, { user }, 'Đăng nhập thành công');
        } catch (error) {
            next(error);
        }
    }

    async refreshToken(req: Request, res: Response, next: NextFunction) {
        try {
            const token = req.cookies.refreshToken || req.body.refreshToken;
            if (!token) {
                res.status(401).json({ success: false, message: 'Refresh token là bắt buộc' });
                return;
            }
            const tokens = await authService.refreshToken(token);
            setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
            sendSuccess(res, null, 'Làm mới token thành công');
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
            const token = req.cookies.refreshToken || req.body.refreshToken;
            if (token) await authService.logout(req.userId!, token);
            clearAuthCookies(res);
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