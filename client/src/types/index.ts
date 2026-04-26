export type SportType = 'badminton' | 'pickleball' | 'both';
export type OnboardingSport = 'badminton' | 'pickleball' | 'tennis';

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
}

export interface CourtPhoto {
    url: string;
    caption?: string;
    isMain: boolean;
    source: 'upload' | 'google';
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
    pricePerHour: { sportType: SportType; timeSlots: { label: string; startTime: string; endTime: string; pricePerHour: number; daysOfWeek: number[] }[] }[];
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
export type BookingType = 'casual' | 'group_play' | 'tournament';
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
}

// ========================
// USER
// ========================
export type UserRole = 'user' | 'court_owner' | 'admin';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'professional';

export interface User {
    _id: string;
    email: string;
    name?: string;
    phone?: string;
    displayName: string;
    avatar?: string;
    role: UserRole;
    status: string;
    skillLevel?: SkillLevel;
    sportPreferences: SportType[];
    stats: { totalBookings: number; totalGroupPlays: number; rating: number; reviewCount: number };
    settings: { notifications: boolean; language: 'vi' | 'en'; theme: 'light' | 'dark' };
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
export type AppPage = 'home' | 'map' | 'search' | 'profile' | 'court-detail' | 'login' | 'admin';