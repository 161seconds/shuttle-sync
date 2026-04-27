import axiosClient from './axiosClient';

export const authApi = {
    register(data: { email: string; password: string; displayName: string; phone?: string }) {
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

    getMe: () => {
        return axiosClient.get('/auth/me');
    },

    changePassword(data: { currentPassword: string; newPassword: string }) {
        return axiosClient.put('/auth/change-password', data);
    },
};