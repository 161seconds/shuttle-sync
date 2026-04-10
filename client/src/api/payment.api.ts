import axiosClient from './axiosClient';

export const paymentApi = {
    confirm: (bookingId: string) => {
        return axiosClient.patch(`/payments/confirm/${bookingId}`);
    }
};