import axiosClient from './axiosClient';

export const voucherApi = {
    // PUBLIC / USER
    validateVoucher: (data: { code: string, venueId: string, totalAmount: number }) => 
        axiosClient.post('/vouchers/validate', data),

    // OWNER
    getOwnerVouchers: () => axiosClient.get('/vouchers/owner/me'),
    requestVoucher: (data: any) => axiosClient.post('/vouchers/owner/request', data),

    // ADMIN
    getAllVouchers: () => axiosClient.get('/vouchers/admin/all'),
    createGlobalVoucher: (data: any) => axiosClient.post('/vouchers/admin/global', data),
    approveVoucher: (id: string, status: 'APPROVED' | 'REJECTED') => 
        axiosClient.patch(`/vouchers/admin/${id}/approve`, { status }),

    // SHARED
    updateVoucher: (id: string, data: any) => axiosClient.patch(`/vouchers/${id}`, data),
    deleteVoucher: (id: string) => axiosClient.delete(`/vouchers/${id}`),
};
