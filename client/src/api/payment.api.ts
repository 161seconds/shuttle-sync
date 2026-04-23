import axiosClient from './axiosClient';

export const paymentApi = {
    validateVoucher(code: string, bookingAmount: number, courtId?: string) {
        return axiosClient.post('/events/validate-voucher', { code, bookingAmount, courtId });
    },
};  