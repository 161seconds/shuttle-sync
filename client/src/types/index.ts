export type SportType = 'badminton' | 'pickleball' | 'both';
export type OnboardingSport = 'badminton' | 'pickleball';

export interface TourStep {
    targetId: string;
    title: string;
    description: string;
    position: 'top' | 'bottom' | 'left' | 'right';
}

export interface CourtData {
    id: string | number;
    name: string;
    address?: string;
    price?: number;
    sportType?: OnboardingSport | string;
    [key: string]: any;
}

export interface CourtAddress {
    street: string;
    ward: string;
    district: string;
    city: string;
    fullAddress: string;
}

export interface SubCourt {
    _id: string;
    name: string;
    sportType: SportType;
    isIndoor: boolean;
    surface?: string;
    isActive: boolean;
    pricePerHour?: number;
    pricingConfigs?: IPricingConfig[];
}

export interface CourtPhoto {
    url: string;
    caption?: string;
    isMain: boolean;
    source: 'upload' | 'google';
}

export interface IPricingConfig {
    startTime: string; // HH:mm
    endTime: string;   // HH:mm
    daysOfWeek: number[]; // 0-6 (0 is Sunday)
    pricePerHour: number;
}

export interface Court {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    ownerId: string;
    sportTypes: SportType[];
    status: string;
    address: CourtAddress;
    location: { lat: number; lng: number };
    contact: { phone: string; email?: string; website?: string; facebook?: string; zalo?: string };
    amenities: string[];
    operatingHours: { dayOfWeek: number; open: string; close: string; isOpen: boolean }[];
    pricePerHour: number;
    pricingConfigs?: IPricingConfig[];
    courts: SubCourt[];
    photos: CourtPhoto[];
    googlePlaceId?: string;
    googleRating?: number;
    googleReviewCount?: number;
    totalBookings: number;
    averageRating: number;
    reviewCount: number;
    isVerified: boolean;
    distance?: number;
    isHot?: boolean;
}

// ========================
// TIMESLOT
// ========================
export type SlotStatus = 'available' | 'selected' | 'booked' | 'expired';

export interface TimeSlot {
    _id: string;
    courtId: string;
    subCourtId: string;
    date: string;
    startTime: string;
    endTime: string;
    status: SlotStatus;
    price: number;
    lockedBy?: string;
}

// ========================
// BOOKING
// ========================
export type BookingStatus = 'pending_payment' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export type BookingType = 'casual' | 'group_play' | 'tournament' | 'fixed';
export type PaymentMethod = 'qr_code' | 'bank_transfer' | 'cash';

export interface Booking {
    _id: string;
    bookingCode: string;
    userId?: string;
    guestInfo?: { name: string; phone: string; email?: string };
    courtId: string;
    subCourtId: string;
    slotIds: string[];
    date: string;
    startTime: string;
    endTime: string;
    type: BookingType;
    status: BookingStatus;
    totalAmount: number;
    discount: number;
    finalAmount: number;
    payment: { method: PaymentMethod; status: string; transactionId?: string; qrCodeUrl?: string; paidAt?: string; expiresAt: string };
    notes?: string;
    court?: Court;
    cancelReason?: string;
}

// ========================
// USER
// ========================
export type UserRole = 'user' | 'court_owner' | 'admin';
export type SkillLevel = 'y' | 'y_minus' | 'y_plus' | 'tby_minus' | 'tby' | 'tby_plus' | 'tb_minus' | 'tb' | 'tb_plus' | 'tb_plus_2' | 'tb_plus_3' | 'tbk' | 'bc' | 'cn';

export interface User {
    _id: string;
    email: string;
    name?: string;
    phone?: string;
    displayName: string;
    avatar?: string;
    favoriteCourtIds?: string[];
    role: UserRole;
    status: string;
    skillLevel?: SkillLevel;
    sportPreferences: SportType[];
    stats?: {
        totalBookings: number;
        totalGroupsCreated: number;
        totalGroupsJoined: number;
        totalTournaments?: number;
        noShowCount?: number;
        rating: number;
        reviewCount: number;
        eloScore?: number;
        activityStreak?: number;
    }; settings: { notifications: boolean; language: 'vi' | 'en'; theme: 'light' | 'dark' };
}

// ========================
// FILTERS
// ========================
export interface CourtFilters {
    sport: string;
    district: string;
    keyword: string;
    sortBy: 'distance' | 'rating' | 'price_asc' | 'price_desc';
    minPrice?: number;
    maxPrice?: number;
    indoorOnly?: boolean;
}

// ========================
// API
// ========================
export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
    pagination?: { page: number; limit: number; total: number; totalPages: number };
}

// ========================
// NAVIGATION
// ========================
export type AppPage = 'home' | 'map' | 'search' | 'profile' | 'court-detail' | 'login' | 'admin'
    | 'edit-profile' | 'favorites' | 'history' | 'tournaments'
    | 'groups' | 'notifications' | 'settings' | 'owner-dashboard'
    | 'groupplay' | 'aicoach' | 'match-leaderboard' | 'rules' | 'supplementary' | 'chat' | 'news' | 'support';

// ========================
// SOCIAL (P2P CHAT & FRIENDS)
// ========================
export type FriendshipStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';

export interface IUserPublic {
    _id: string;
    displayName: string;
    avatar?: string;
    skillLevel?: string;
    stats?: any;
}

export interface IFriendship {
    _id: string;
    requesterId: IUserPublic;
    recipientId: IUserPublic;
    status: FriendshipStatus;
    createdAt: string;
}

export interface IMessage {
    _id: string;
    conversationId: string;
    senderId: string;
    senderName?: string;
    senderAvatar?: string;
    content: string;
    replyTo?: {
        messageId: string;
        senderName: string;
        content: string;
    };
    isRead: boolean;
    isRecalled?: boolean;
    deletedBy?: string[];
    createdAt: string;
}

export interface IConversation {
    _id: string;
    participants: string[];
    participantDetails?: IUserPublic[];
    lastMessage?: IMessage;
    unreadCount: Record<string, number>;
    archivedBy?: string[];
    deletedBy?: string[];
    updatedAt: string;
}