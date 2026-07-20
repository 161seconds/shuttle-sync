import axiosClient from './axiosClient';

export const groupPlayApi = {
    // Tìm kiếm / Lấy danh sách nhóm (Có phân trang, lọc theo môn, trình độ...)
    searchGroupPlays(params?: Record<string, any>) {
        return axiosClient.get('/group-plays/search', { params });
    },

    // Lấy chi tiết 1 nhóm
    getGroupPlayById(id: string) {
        return axiosClient.get(`/group-plays/${id}`);
    },

    // Tạo kèo giao lưu mới
    createGroupPlay(data: Record<string, any>) {
        return axiosClient.post('/group-plays', data);
    },

    // Lấy danh sách các nhóm mình đã tạo hoặc tham gia
    getMyGroupPlays(params?: Record<string, any>) {
        return axiosClient.get('/group-plays/user/my', { params });
    },

    // Tham gia nhóm
    joinGroupPlay(groupPlayId: string) {
        return axiosClient.post(`/group-plays/${groupPlayId}/join`);
    },

    // Hủy yêu cầu tham gia
    cancelJoinRequest(groupPlayId: string) {
        return axiosClient.post(`/group-plays/${groupPlayId}/join/cancel`);
    },

    // Rời khỏi nhóm
    leaveGroupPlay(groupPlayId: string) {
        return axiosClient.post(`/group-plays/${groupPlayId}/leave`);
    },

    // Chủ nhóm hủy kèo
    cancelGroupPlay(groupPlayId: string) {
        return axiosClient.post(`/group-plays/${groupPlayId}/cancel`);
    },

    // Duyệt người chơi vào nhóm
    acceptJoinRequest(groupPlayId: string, requesterId: string) {
        return axiosClient.post(`/group-plays/${groupPlayId}/requests/${requesterId}/accept`);
    },

    // Từ chối người chơi
    rejectJoinRequest(groupPlayId: string, requesterId: string, reason?: string) {
        return axiosClient.post(`/group-plays/${groupPlayId}/requests/${requesterId}/reject`, { reason });
    }
};