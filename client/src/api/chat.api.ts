import axiosClient from './axiosClient';
import type { ApiResponse, IConversation, IMessage } from '../types';

export interface ChatMessage {
    _id: string;
    groupPlayId: string;
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    content: string;
    replyTo?: {
        messageId: string;
        senderName: string;
        content: string;
    };
    createdAt: string;
}

export const chatApi = {
    getHistory: (groupPlayId: string, page = 1, limit = 50) => {
        return axiosClient.get(`/chat/group/${groupPlayId}`, {
            params: { page, limit },
        });
    },
    deleteChat: (groupPlayId: string) => {
        return axiosClient.delete(`/chat/group/${groupPlayId}`);
    },

    // P2P CHAT
    getConversations: async (): Promise<IConversation[]> => {
        const response = await axiosClient.get<ApiResponse<IConversation[]>>('/chat/conversations');
        return response.data.data!;
    },
    getMessages: async (conversationId: string): Promise<IMessage[]> => {
        const response = await axiosClient.get<ApiResponse<IMessage[]>>(`/chat/conversations/${conversationId}/messages`);
        return response.data.data!;
    },
    createConversation: async (recipientId: string): Promise<IConversation> => {
        const response = await axiosClient.post<ApiResponse<IConversation>>('/chat/conversations', { recipientId });
        return response.data.data!;
    },
};
