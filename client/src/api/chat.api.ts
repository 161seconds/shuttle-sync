import axiosClient from './axiosClient';

export interface ChatMessage {
    _id: string;
    groupPlayId: string;
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    content: string;
    createdAt: string;
}

export const chatApi = {
    getHistory: (groupPlayId: string, page = 1, limit = 50) => {
        return axiosClient.get(`/chat/${groupPlayId}`, {
            params: { page, limit },
        });
    },
};
