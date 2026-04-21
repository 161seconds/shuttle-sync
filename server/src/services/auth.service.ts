import jwt from 'jsonwebtoken';
import { UserRole, UserStatus, AuthProvider } from '@shuttle-sync/shared';
import { User, IUserDocument } from '../models';
import { config } from '../config';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

class AuthService {
    /**
     * Register a new user
     */
    async register(data: {
        email: string;
        password: string;
        displayName: string;
        phone?: string;
    }): Promise<{ user: IUserDocument; tokens: TokenPair }> {
        const existingUser = await User.findByEmail(data.email);
        if (existingUser) {
            throw ApiError.conflict('Email đã được sử dụng');
        }

        const user = await User.create({
            ...data,
            authProvider: AuthProvider.LOCAL,
            role: UserRole.USER,
            status: UserStatus.ACTIVE,
        });

        const tokens = this.generateTokens(user);
        await this.saveRefreshToken(user._id.toString(), tokens.refreshToken);

        logger.info(`New user registered: ${user.email}`);
        return { user, tokens };
    }

    /**
     * Login with email and password
     */
    async login(email: string, password: string): Promise<{ user: IUserDocument; tokens: TokenPair }> {
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user || !user.password) {
            throw ApiError.unauthorized('Email hoặc mật khẩu không đúng');
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw ApiError.unauthorized('Email hoặc mật khẩu không đúng');
        }

        if (user.status === UserStatus.BANNED) {
            if (user.banInfo?.expiresAt && new Date(user.banInfo.expiresAt) < new Date()) {
                user.status = UserStatus.ACTIVE;
                user.banInfo = undefined;
            } else {
                throw ApiError.forbidden(
                    `Tài khoản đã bị cấm${user.banInfo?.reason ? `: ${user.banInfo.reason}` : ''}`
                );
            }
        }

        const tokens = this.generateTokens(user);
        await this.saveRefreshToken(user._id.toString(), tokens.refreshToken);

        user.lastLoginAt = new Date();
        await user.save();

        logger.info(`User logged in: ${user.email}`);
        return { user, tokens };
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshToken(refreshToken: string): Promise<TokenPair> {
        try {
            const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as {
                userId: string;
                role: UserRole;
                email: string;
            };

            const user = await User.findById(decoded.userId).select('+refreshTokens');
            if (!user) {
                throw ApiError.unauthorized('Tài khoản không tồn tại');
            }

            // Check if refresh token exists (rotation check)
            if (!user.refreshTokens?.includes(refreshToken)) {
                // Possible token reuse attack - invalidate all tokens
                user.refreshTokens = [];
                await user.save();
                logger.warn(`Possible token reuse attack for user: ${user.email}`);
                throw ApiError.unauthorized('Token đã bị thu hồi');
            }

            // Remove used refresh token (rotation)
            user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);

            // Generate new pair
            const newTokens = this.generateTokens(user);
            user.refreshTokens.push(newTokens.refreshToken);

            // Keep only last 5 refresh tokens
            if (user.refreshTokens.length > 5) {
                user.refreshTokens = user.refreshTokens.slice(-5);
            }

            await user.save();
            return newTokens;
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw ApiError.unauthorized('Refresh token không hợp lệ');
        }
    }

    /**
     * Logout - remove refresh token
     */
    async logout(userId: string, refreshToken?: string): Promise<void> {
        if (refreshToken) {
            await User.findByIdAndUpdate(userId, {
                $pull: { refreshTokens: refreshToken },
            });
        } else {
            // Logout all sessions
            await User.findByIdAndUpdate(userId, {
                $set: { refreshTokens: [] },
            });
        }
    }

    /**
     * Change password
     */
    async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
        const user = await User.findById(userId).select('+password');
        if (!user || !user.password) {
            throw ApiError.notFound('Tài khoản không tồn tại');
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            throw ApiError.badRequest('Mật khẩu hiện tại không đúng');
        }

        user.password = newPassword;
        user.refreshTokens = []; // Invalidate all sessions
        await user.save();
    }

    // ---- Private helpers ----

    private generateTokens(user: IUserDocument): TokenPair {
        const payload = {
            userId: user._id.toString(),
            role: user.role,
            email: user.email,
        };

        const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
            expiresIn: config.jwt.accessExpiresIn as any,
        });

        const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
            expiresIn: config.jwt.refreshExpiresIn as any,
        });

        return { accessToken, refreshToken };
    }

    private async saveRefreshToken(userId: string, refreshToken: string): Promise<void> {
        await User.findByIdAndUpdate(userId, {
            $push: {
                refreshTokens: {
                    $each: [refreshToken],
                    $slice: -5, // Keep only last 5
                },
            },
        });
    }
}

export const authService = new AuthService();