export interface ChatUser {
    id: string;
    name: string;
    avatar: string;
    skillLevel: string; // e.g. "Beginner", "Intermediate", "Advanced"
    status: 'active' | 'banned';
    matchesPlayed: number;
    favoriteCourt: string;
    joinedDate: string;
}

export interface ChatMessage {
    id: string;
    roomId: string;
    senderId: string;
    content: string;
    timestamp: string; // ISO string
}

export interface ChatRoom {
    id: string;
    name: string;
    avatar: string;
    statusText: string;
    unreadCount: number;
    lastMessage?: string;
    lastMessageTime?: string;
    organizerId?: string;
    date?: string;
    isChatDeleted?: boolean;
}

// 1. Mock Users (including the logged in user)
export const currentUser: ChatUser = {
    id: 'user_1',
    name: 'Bạn',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    skillLevel: 'Intermediate',
    status: 'active',
    matchesPlayed: 42,
    favoriteCourt: 'Sân Cầu Lông Bình Thạnh',
    joinedDate: '2023-01-15'
};

export const mockUsers: Record<string, ChatUser> = {
    'user_1': currentUser,
    'user_2': {
        id: 'user_2',
        name: 'Nguyễn Văn A',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
        skillLevel: 'Advanced',
        status: 'active',
        matchesPlayed: 128,
        favoriteCourt: 'Sân Cầu Lông Viettel',
        joinedDate: '2022-05-10'
    },
    'user_3': {
        id: 'user_3',
        name: 'Trần Thị B',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella',
        skillLevel: 'Beginner',
        status: 'active',
        matchesPlayed: 12,
        favoriteCourt: 'Sân Cầu Lông Thủ Đức',
        joinedDate: '2024-02-01'
    },
    'user_4': {
        id: 'user_4',
        name: 'Lê Hoàng C (Banned)',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie',
        skillLevel: 'Intermediate',
        status: 'banned',
        matchesPlayed: 56,
        favoriteCourt: 'Sân Chảo Lửa',
        joinedDate: '2023-08-20'
    },
    'user_5': {
        id: 'user_5',
        name: 'Phạm D',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Daisy',
        skillLevel: 'Professional',
        status: 'active',
        matchesPlayed: 300,
        favoriteCourt: 'Sân Đào Duy Anh',
        joinedDate: '2021-11-05'
    }
};

// 2. Mock Rooms
export const mockRooms: ChatRoom[] = [
    {
        id: 'room_1',
        name: 'Sân Cầu Lông Bình Thạnh',
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=BT',
        statusText: '12 thành viên',
        unreadCount: 3,
        lastMessage: 'Đủ người chưa các bạn?',
        lastMessageTime: '10:30'
    },
    {
        id: 'room_2',
        name: 'Nhóm Cầu Lông Tối Thứ 6',
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=T6',
        statusText: 'Đang hoạt động',
        unreadCount: 0,
        lastMessage: 'Ok chốt lịch nhé.',
        lastMessageTime: 'Hôm qua'
    },
    {
        id: 'room_3',
        name: 'Sân Cầu Lông Thủ Đức',
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=TD',
        statusText: '8 thành viên',
        unreadCount: 1,
        lastMessage: 'Hôm nay mình đến muộn 15p',
        lastMessageTime: '08:15'
    },
    {
        id: 'room_4',
        name: 'Giao lưu trình độ TB-Khá',
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=GL',
        statusText: '24 thành viên',
        unreadCount: 0,
        lastMessage: 'Tuyệt vời!',
        lastMessageTime: 'T.2'
    },
    {
        id: 'room_5',
        name: 'Sân Chảo Lửa',
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=CL',
        statusText: 'Tạm ngưng',
        unreadCount: 0,
        lastMessage: 'Sân đang bảo trì',
        lastMessageTime: '22/05'
    }
];

// Helper to generate a timestamp based on current time
const getPastTime = (minutesAgo: number) => {
    return new Date(Date.now() - minutesAgo * 60000).toISOString();
};

// 3. Mock Messages
export const mockMessages: Record<string, ChatMessage[]> = {
    'room_1': [
        { id: 'm1', roomId: 'room_1', senderId: 'user_2', content: 'Hôm nay mấy giờ bắt đầu vậy mọi người?', timestamp: getPastTime(120) },
        { id: 'm2', roomId: 'room_1', senderId: 'user_3', content: 'Hình như 7h tối á anh', timestamp: getPastTime(115) },
        { id: 'm3', roomId: 'room_1', senderId: 'user_1', content: 'Đúng rồi, 7h - 9h nha.', timestamp: getPastTime(110) },
        { id: 'm4', roomId: 'room_1', senderId: 'user_4', content: 'Cho mình đăng ký 1 slot với!', timestamp: getPastTime(105) },
        { id: 'm5', roomId: 'room_1', senderId: 'user_2', content: 'Đủ người chưa các bạn?', timestamp: getPastTime(5) } // Unread
    ],
    'room_2': [
        { id: 'm6', roomId: 'room_2', senderId: 'user_5', content: 'Thứ 6 này ai đánh không?', timestamp: getPastTime(1440 * 2) },
        { id: 'm7', roomId: 'room_2', senderId: 'user_1', content: 'Có em nha anh', timestamp: getPastTime(1440 * 1.5) },
        { id: 'm8', roomId: 'room_2', senderId: 'user_5', content: 'Ok chốt lịch nhé.', timestamp: getPastTime(1440 * 1) }
    ],
    'room_3': [
        { id: 'm9', roomId: 'room_3', senderId: 'user_1', content: 'Sân số 3 nha mọi người', timestamp: getPastTime(300) },
        { id: 'm10', roomId: 'room_3', senderId: 'user_3', content: 'Dạ, em đang tới', timestamp: getPastTime(60) },
        { id: 'm11', roomId: 'room_3', senderId: 'user_4', content: 'Hôm nay mình đến muộn 15p', timestamp: getPastTime(10) } // Unread
    ],
    'room_4': [
        { id: 'm12', roomId: 'room_4', senderId: 'user_5', content: 'Trận hôm qua hay quá', timestamp: getPastTime(2880) },
        { id: 'm13', roomId: 'room_4', senderId: 'user_2', content: 'Công nhận, mệt bơ phờ', timestamp: getPastTime(2870) },
        { id: 'm14', roomId: 'room_4', senderId: 'user_1', content: 'Tuyệt vời!', timestamp: getPastTime(2800) }
    ],
    'room_5': [
        { id: 'm15', roomId: 'room_5', senderId: 'user_1', content: 'Sân này còn trống ngày mai không?', timestamp: getPastTime(10000) },
        { id: 'm16', roomId: 'room_5', senderId: 'user_5', content: 'Sân đang bảo trì', timestamp: getPastTime(9999) }
    ]
};
