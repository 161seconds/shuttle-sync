import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../user/user.model.js'; 

export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;

        // 1. Kiểm tra user tồn tại chưa
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email này đã được đăng ký!' });
        }

        // 2. Hash mật khẩu (Production-ready)
        const hashedPassword = await bcrypt.hash(password, 12);

        // 3. Lưu vào DB
        await UserModel.create({
            name,
            email,
            password: hashedPassword,
            role: 'user' // Mặc định là user
        });

        res.status(201).json({ message: 'Đăng ký thành công! Mời bạn đăng nhập.' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server, thử lại sau!' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // 1. Tìm user
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng!' });
        }

        // 2. So khớp mật khẩu
        const isMatch = await bcrypt.compare(password, user.password!);
        if (!isMatch) {
            return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng!' });
        }

        // 3. Tạo JWT Token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'shuttlesync_secret_key',
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi đăng nhập!' });
    }
};