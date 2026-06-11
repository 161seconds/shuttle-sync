import axiosClient from './axiosClient';
import type { ApiResponse, IFriendship, IUserPublic } from '../types';

export const friendApi = {
    getFriends: async (): Promise<IUserPublic[]> => {
        const response = await axiosClient.get<ApiResponse<IUserPublic[]>>('/friends');
        return response.data.data!;
    },

    getPendingRequests: async (): Promise<IFriendship[]> => {
        const response = await axiosClient.get<ApiResponse<IFriendship[]>>('/friends/pending');
        return response.data.data!;
    },

    sendRequest: async (recipientId: string): Promise<IFriendship> => {
        const response = await axiosClient.post<ApiResponse<IFriendship>>('/friends/request', { recipientId });
        return response.data.data!;
    },

    acceptRequest: async (friendshipId: string): Promise<IFriendship> => {
        const response = await axiosClient.post<ApiResponse<IFriendship>>(`/friends/accept/${friendshipId}`);
        return response.data.data!;
    },

    searchUsers: async (query: string): Promise<IUserPublic[]> => {
        const response = await axiosClient.get<ApiResponse<IUserPublic[]>>(`/friends/search`, { params: { query } });
        return response.data.data!;
    },
};
