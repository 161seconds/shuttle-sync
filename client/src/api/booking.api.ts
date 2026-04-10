import axiosClient from './axiosClient';

export const bookingApi = {
    getBookingsByCourtAndDate: (courtId: string, date: string) => {
        return axiosClient.get(`/bookings/${courtId}/${date}`);
    },
    createBooking: (data: { courtId: string; date: string; timeSlot: string }) => {
        return axiosClient.post('/bookings', data);
    }
};