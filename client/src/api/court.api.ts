import axiosClient from './axiosClient';
import type { Court } from '../../../shared/types'; // Tái sử dụng Type

export const courtApi = {
    getAllCourts: () => {
        // Vì axiosClient đã cấu hình trả về response.data, nên kết quả ở đây chính là mảng Court[]
        return axiosClient.get<any, Court[]>('/courts');
    }
};