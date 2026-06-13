import axiosClient from './axiosClient';

export const adminApi = {
    getDashboardStats() {
        return axiosClient.get('/admin/dashboard');
    },
    getAllBookings(params?: any) {
        return axiosClient.get('/admin/bookings', { params });
    },
    // Add other endpoints like getUsers, getAllCourts, etc. later if needed.
};
