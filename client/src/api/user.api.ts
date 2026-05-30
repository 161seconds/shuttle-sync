import axiosClient from './axiosClient';

export const userApi = {
    getPublicProfile(userId: string) {
        return axiosClient.get(`/users/public/${userId}`);
    }
};
