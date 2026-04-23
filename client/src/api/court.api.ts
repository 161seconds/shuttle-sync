import axiosClient from './axiosClient';

export const courtApi = {
    searchCourts(params?: Record<string, any>) {
        return axiosClient.get('/courts/search', { params });
    },

    getCourtByIdOrSlug(idOrSlug: string) {
        return axiosClient.get(`/courts/${idOrSlug}`);
    },

    getAvailableSlots(courtId: string, subCourtId: string, date: string) {
        return axiosClient.get(`/courts/${courtId}/slots/${subCourtId}`, { params: { date } });
    },

    getDistricts() {
        return axiosClient.get('/courts/districts');
    },

    getActiveCourts(params?: Record<string, any>) {
        return axiosClient.get('/courts/active', { params });
    },

    // Court owner
    getMyCourts() {
        return axiosClient.get('/courts/owner/my-courts');
    },

    createCourt(data: any) {
        return axiosClient.post('/courts', data);
    },

    updateCourt(courtId: string, data: any) {
        return axiosClient.put(`/courts/${courtId}`, data);
    },
};