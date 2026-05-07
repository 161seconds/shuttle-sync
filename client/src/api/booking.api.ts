import axiosClient from './axiosClient';

export const bookingApi = {
    createBooking(data: {
        courtId: string;
        subCourtId: string;
        slotIds: string[];
        date: string;
        type?: string;
        paymentMethod?: string;
        voucherCode?: string;
        notes?: string;
        guestInfo?: { name: string; phone: string; email?: string };
    }) {
        return axiosClient.post('/bookings', data);
    },

    confirmPayment: (code: string) => axiosClient.post(`/bookings/${code}/confirm-payment`),

    cancelBooking(bookingId: string, reason: string) {
        return axiosClient.post(`/bookings/${bookingId}/cancel`, { reason });
    },

    getMyBookings: (params?: any) => axiosClient.get('/bookings/my', { params }),

    getBookingById(bookingId: string) {
        return axiosClient.get(`/bookings/${bookingId}`);
    },

    getBookingByCode(code: string) {
        return axiosClient.get(`/bookings/code/${code}`);
    },

    getCourtBookings(courtId: string, params?: Record<string, any>) {
        return axiosClient.get(`/bookings/court/${courtId}`, { params });
    },
};