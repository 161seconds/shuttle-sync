import axiosClient from './axiosClient';

export const adminApi = {
    getDashboardStats() {
        return axiosClient.get('/admin/dashboard');
    },
    // Add other endpoints like getUsers, getAllCourts, etc. later if needed.
};
