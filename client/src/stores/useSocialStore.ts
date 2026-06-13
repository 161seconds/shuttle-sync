import { create } from 'zustand';
import type { IConversation, IFriendship, IMessage, IUserPublic } from '../types';
import { friendApi } from '../api/friend.api';
import { chatApi } from '../api/chat.api';

interface SocialState {
    friends: IUserPublic[];
    pendingRequests: IFriendship[];
    conversations: IConversation[];
    messages: Record<string, IMessage[]>; // conversationId -> messages
    activeConversationId: string | null;
    isDrawerOpen: boolean;
    onlineUsers: Set<string>;

    // Actions
    fetchFriends: () => Promise<void>;
    fetchPendingRequests: () => Promise<void>;
    fetchConversations: () => Promise<void>;
    fetchMessages: (conversationId: string, currentUserId?: string) => Promise<void>;
    
    setActiveConversation: (id: string | null) => void;
    toggleDrawer: () => void;
    setDrawerOpen: (isOpen: boolean) => void;
    
    // Socket handlers
    addMessage: (message: IMessage, currentUserId?: string) => void;
    updateOnlineUsers: (userId: string, isOnline: boolean) => void;
}

export const useSocialStore = create<SocialState>((set) => ({
    friends: [],
    pendingRequests: [],
    conversations: [],
    messages: {},
    activeConversationId: null,
    isDrawerOpen: false,
    onlineUsers: new Set(),

    fetchFriends: async () => {
        try {
            const friends = await friendApi.getFriends();
            set({ friends });
        } catch (error) {
            console.error('Failed to fetch friends', error);
        }
    },

    fetchPendingRequests: async () => {
        try {
            const requests = await friendApi.getPendingRequests();
            set({ pendingRequests: requests });
        } catch (error) {
            console.error('Failed to fetch pending requests', error);
        }
    },

    fetchConversations: async () => {
        try {
            const conversations = await chatApi.getConversations();
            set({ conversations });
        } catch (error) {
            console.error('Failed to fetch conversations', error);
        }
    },

    fetchMessages: async (conversationId: string, currentUserId?: string) => {
        try {
            const messagesList = await chatApi.getMessages(conversationId);
            set((state) => {
                let updatedConversations = state.conversations;
                
                if (currentUserId) {
                    updatedConversations = state.conversations.map(conv => {
                        if (conv._id === conversationId && conv.unreadCount) {
                            const newUnread = { ...conv.unreadCount };
                            newUnread[currentUserId] = 0;
                            return { ...conv, unreadCount: newUnread };
                        }
                        return conv;
                    });
                }

                return {
                    messages: {
                        ...state.messages,
                        [conversationId]: messagesList,
                    },
                    conversations: updatedConversations,
                };
            });
        } catch (error) {
            console.error('Failed to fetch messages', error);
        }
    },

    setActiveConversation: (id) => set({ activeConversationId: id }),
    toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
    setDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),

    addMessage: (message, currentUserId?: string) => {
        set((state) => {
            const currentMessages = state.messages[message.conversationId] || [];
            
            // Check for duplicates
            if (currentMessages.some(m => m._id === message._id)) {
                return state;
            }

            // Move conversation to top
            const updatedConversations = [...state.conversations];
            const convIndex = updatedConversations.findIndex(c => c._id === message.conversationId);
            if (convIndex > -1) {
                const [conv] = updatedConversations.splice(convIndex, 1);
                conv.lastMessage = message;
                
                if (currentUserId && message.senderId !== currentUserId && state.activeConversationId !== message.conversationId) {
                    const newUnread = { ...conv.unreadCount };
                    newUnread[currentUserId] = (newUnread[currentUserId] || 0) + 1;
                    conv.unreadCount = newUnread;
                }

                updatedConversations.unshift(conv);
            }

            return {
                messages: {
                    ...state.messages,
                    [message.conversationId]: [...currentMessages, message],
                },
                conversations: updatedConversations,
            };
        });
    },

    updateOnlineUsers: (userId, isOnline) => {
        set((state) => {
            const newSet = new Set(state.onlineUsers);
            if (isOnline) {
                newSet.add(userId);
            } else {
                newSet.delete(userId);
            }
            return { onlineUsers: newSet };
        });
    },
}));
