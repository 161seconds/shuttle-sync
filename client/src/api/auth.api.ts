import axiosClient from './axiosClient';

export const authApi = {
    login: (data: any) => {
        return axiosClient.post('/auth/login', data);
    },
    register: (data: any) => {
        return axiosClient.post('/auth/register', data);
    },
};