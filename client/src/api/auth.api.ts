import axiosClient from './axiosClient';
import type { AxiosResponse } from 'axios';
import type { ApiResponse, User } from '../types';

export const authApi = {
    register(data: { email: string; password: string; displayName: string; phone?: string; role?: string }) {
        return axiosClient.post('/auth/register', data);
    },

    login(data: { email: string; password: string }) {
        return axiosClient.post('/auth/login', data);
    },

    refreshToken(refreshToken: string) {
        return axiosClient.post('/auth/refresh-token', { refreshToken });
    },

    logout(refreshToken?: string) {
        return axiosClient.post('/auth/logout', { refreshToken });
    },

    getMe: (): Promise<AxiosResponse<ApiResponse<{ user: User }>>> => {
        return axiosClient.get('/auth/profile');
    },

    updateProfile: (data: Partial<User>): Promise<AxiosResponse<ApiResponse<User>>> => {
        return axiosClient.put('/auth/profile', data);
    },

    changePassword(data: { currentPassword: string; newPassword: string }) {
        return axiosClient.put('/auth/change-password', data);
    },

    requestOtp: (email: string) =>
        axiosClient.post('/auth/request-otp', { email }),

    verifyOtp: (email: string, otp: string) =>
        axiosClient.post('/auth/verify-otp', { email, otp }),
};