import {
    UserRole, UserStatus, SportType, CourtStatus, SlotStatus,
    BookingStatus, BookingType, PaymentStatus, PaymentMethod,
    GroupPlayStatus, GroupPlayRole, SkillLevel,
    TournamentStatus, TournamentFormat,
    OwnerApplicationStatus, EventType, VoucherType,
    ReportReason, ReportStatus, AuthProvider,
} from './constants';

// ========================
// COMMON
// ========================
export interface ITimestamps {
    createdAt: Date;
    updatedAt: Date;
}

export interface IPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface IApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
    pagination?: IPagination;
    errors?: Record<string, string[]>;
}

export interface ICoordinates {
    lat: number;
    lng: number;
}

export interface ITimeRange {
    start: string; // HH:mm
    end: string;   // HH:mm
}

// ========================
// USER
// ========================
export interface IUser extends ITimestamps {
    _id: string;
    email: string;
    phone?: string;
    password?: string; // excluded from response
    displayName: string;
    avatar?: string;
    role: UserRole;
    status: UserStatus;
    authProvider: AuthProvider;
    googleId?: string;
    skillLevel?: SkillLevel;
    sportPreferences: SportType[];
    favoriteCourtIds: string[];
    stats: IUserStats;
    settings: IUserSettings;
    banInfo?: IBanInfo;
    lastLoginAt?: Date;
}

export interface IUserStats {
    totalBookings: number;
    totalGroupPlays: number;
    totalTournaments: number;
    noShowCount: number;
    rating: number;
    reviewCount: number;
}

export interface IUserSettings {
    notifications: boolean;
    emailNotifications: boolean;
    language: 'vi' | 'en';
    theme: 'light' | 'dark';
}

export interface IBanInfo {
    reason: string;
    bannedAt: Date;
    bannedBy: string;
    expiresAt?: Date; // null = permanent
}

export interface IUserPublic {
    _id: string;
    displayName: string;
    avatar?: string;
    skillLevel?: SkillLevel;
    stats: Pick<IUserStats, 'rating' | 'reviewCount' | 'totalGroupPlays'>;
}

// ========================
// AUTH
// ========================
export interface ILoginRequest {
    email: string;
    password: string;
}

export interface IRegisterRequest {
    email: string;
    password: string;
    displayName: string;
    phone?: string;
}

export interface IAuthResponse {
    user: Omit<IUser, 'password'>;
    accessToken: string;
    refreshToken: string;
}

export interface ITokenPayload {
    userId: string;
    role: UserRole;
    email: string;
}

export interface IGuestBookingRequest {
    name: string;
    phone: string;
    email?: string;
}

// ========================
// COURT
// ========================
export interface ICourt extends ITimestamps {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    ownerId: string;
    sportTypes: SportType[];
    status: CourtStatus;
    address: ICourtAddress;
    location: ICoordinates;
    contact: ICourtContact;
    amenities: string[];
    operatingHours: IOperatingHours[];
    pricePerHour: IPricing[];
    courts: ISubCourt[];
    photos: ICourtPhoto[];
    googlePlaceId?: string;
    googleRating?: number;
    googleReviewCount?: number;
    googlePhotos?: string[];
    totalBookings: number;
    averageRating: number;
    reviewCount: number;
    isVerified: boolean;
}

export interface ICourtAddress {
    street: string;
    ward: string;
    district: string;
    city: string;
    fullAddress: string;
}

export interface ICourtContact {
    phone: string;
    email?: string;
    website?: string;
    facebook?: string;
    zalo?: string;
}

export interface IOperatingHours {
    dayOfWeek: number; // 0=Sunday, 6=Saturday
    open: string;      // HH:mm
    close: string;     // HH:mm
    isOpen: boolean;
}

export interface IPricing {
    sportType: SportType;
    timeSlots: IPriceTimeSlot[];
}

export interface IPriceTimeSlot {
    label: string;       // "Sáng", "Chiều", "Tối", "Cuối tuần"
    startTime: string;   // HH:mm
    endTime: string;     // HH:mm
    pricePerHour: number;
    daysOfWeek: number[]; // [0,1,2,3,4,5,6]
}

export interface ISubCourt {
    _id: string;
    name: string;          // "Sân 1", "Sân 2"
    sportType: SportType;
    isIndoor: boolean;
    surface?: string;      // "Gỗ", "PVC", "Xi măng"
    isActive: boolean;
}

export interface ICourtPhoto {
    url: string;
    caption?: string;
    isMain: boolean;
    source: 'upload' | 'google';
}

// ========================
// TIME SLOT
// ========================
export interface ITimeSlot extends ITimestamps {
    _id: string;
    courtId: string;
    subCourtId: string;
    date: Date;
    startTime: string;    // HH:mm
    endTime: string;      // HH:mm
    status: SlotStatus;
    price: number;
    lockedBy?: string;    // userId who is selecting
    lockedAt?: Date;
    bookingId?: string;
}

// ========================
// BOOKING
// ========================
export interface IBooking extends ITimestamps {
    _id: string;
    bookingCode: string;
    userId?: string;          // null for guest booking
    guestInfo?: IGuestBookingRequest;
    courtId: string;
    subCourtId: string;
    slotIds: string[];
    date: Date;
    startTime: string;
    endTime: string;
    type: BookingType;
    status: BookingStatus;
    totalAmount: number;
    discount: number;
    finalAmount: number;
    voucherCode?: string;
    payment: IPaymentInfo;
    notes?: string;
    cancelReason?: string;
    cancelledAt?: Date;
    confirmedAt?: Date;
}

export interface IPaymentInfo {
    method: PaymentMethod;
    status: PaymentStatus;
    transactionId?: string;
    qrCodeUrl?: string;
    paidAt?: Date;
    expiresAt: Date;
}

// ========================
// GROUP PLAY (Vãng lai)
// ========================
export interface IGroupPlay extends ITimestamps {
    _id: string;
    title: string;
    description?: string;
    organizerId: string;
    courtId: string;
    subCourtId: string;
    bookingId: string;
    date: Date;
    startTime: string;
    endTime: string;
    sportType: SportType;
    skillLevel: SkillLevel;
    maxPlayers: number;
    currentPlayers: number;
    pricePerPlayer: number;
    participants: IGroupPlayParticipant[];
    status: GroupPlayStatus;
    isPublic: boolean;
    requirements?: string;
    contactInfo?: string;
}

export interface IGroupPlayParticipant {
    userId: string;
    displayName: string;
    avatar?: string;
    role: GroupPlayRole;
    joinedAt: Date;
    hasPaid: boolean;
}

// ========================
// TOURNAMENT
// ========================
export interface ITournament extends ITimestamps {
    _id: string;
    title: string;
    description: string;
    organizerId: string;
    courtId: string;
    sportType: SportType;
    format: TournamentFormat;
    status: TournamentStatus;
    startDate: Date;
    endDate: Date;
    registrationDeadline: Date;
    maxTeams: number;
    currentTeams: number;
    entryFee: number;
    prizes: ITournamentPrize[];
    rules?: string;
    contactInfo: string;
    bannerImage?: string;
    teams: ITournamentTeam[];
    matches: ITournamentMatch[];
}

export interface ITournamentPrize {
    position: number;
    description: string;
    amount?: number;
}

export interface ITournamentTeam {
    _id: string;
    name: string;
    members: IUserPublic[];
    registeredAt: Date;
    hasPaid: boolean;
    seed?: number;
}

export interface ITournamentMatch {
    _id: string;
    round: number;
    matchNumber: number;
    team1Id?: string;
    team2Id?: string;
    score1?: number;
    score2?: number;
    winnerId?: string;
    courtId: string;
    subCourtId?: string;
    scheduledAt?: Date;
    completedAt?: Date;
}

// ========================
// COURT OWNER APPLICATION
// ========================
export interface IOwnerApplication extends ITimestamps {
    _id: string;
    userId: string;
    courtName: string;
    courtAddress: ICourtAddress;
    courtLocation: ICoordinates;
    sportTypes: SportType[];
    businessLicense?: string;   // URL to uploaded doc
    identityDocument: string;   // URL to uploaded doc
    courtPhotos: string[];      // URLs
    googlePlaceId?: string;
    additionalNotes?: string;
    status: OwnerApplicationStatus;
    reviewedBy?: string;
    reviewNotes?: string;
    reviewedAt?: Date;
}

// ========================
// EVENT / VOUCHER
// ========================
export interface IEvent extends ITimestamps {
    _id: string;
    title: string;
    description: string;
    type: EventType;
    bannerImage?: string;
    startDate: Date;
    endDate: Date;
    courtId?: string;
    tournamentId?: string;
    voucher?: IVoucher;
    isActive: boolean;
    createdBy: string;
}

export interface IVoucher {
    code: string;
    type: VoucherType;
    value: number;          // percentage or fixed amount
    minBookingAmount?: number;
    maxDiscount?: number;
    usageLimit: number;
    usedCount: number;
    expiresAt: Date;
    applicableCourtIds?: string[];
    applicableSportTypes?: SportType[];
}

// ========================
// REVIEW
// ========================
export interface IReview extends ITimestamps {
    _id: string;
    userId: string;
    courtId: string;
    bookingId: string;
    rating: number;        // 1-5
    comment?: string;
    photos?: string[];
    reply?: IReviewReply;
}

export interface IReviewReply {
    userId: string;         // court owner
    comment: string;
    repliedAt: Date;
}

// ========================
// REPORT
// ========================
export interface IReport extends ITimestamps {
    _id: string;
    reporterId: string;
    targetUserId?: string;
    targetCourtId?: string;
    reason: ReportReason;
    description: string;
    evidence?: string[];     // URLs
    status: ReportStatus;
    resolution?: string;
    resolvedBy?: string;
    resolvedAt?: Date;
}

// ========================
// NOTIFICATION
// ========================
export interface INotification extends ITimestamps {
    _id: string;
    userId: string;
    title: string;
    message: string;
    type: 'booking' | 'group_play' | 'tournament' | 'system' | 'promotion';
    data?: Record<string, unknown>;
    isRead: boolean;
    readAt?: Date;
}

// ========================
// SEARCH & FILTER
// ========================
export interface ICourtSearchParams {
    query?: string;
    sportType?: SportType;
    district?: string;
    minPrice?: number;
    maxPrice?: number;
    date?: string;            // YYYY-MM-DD
    startTime?: string;       // HH:mm
    endTime?: string;         // HH:mm
    hasAvailableSlots?: boolean;
    isIndoor?: boolean;
    sortBy?: 'price' | 'rating' | 'distance' | 'popularity';
    sortOrder?: 'asc' | 'desc';
    lat?: number;
    lng?: number;
    radius?: number;          // km
    page?: number;
    limit?: number;
}

export interface IGroupPlaySearchParams {
    sportType?: SportType;
    skillLevel?: SkillLevel;
    date?: string;
    district?: string;
    status?: GroupPlayStatus;
    page?: number;
    limit?: number;
}

// ========================
// ADMIN DASHBOARD
// ========================
export interface IAdminStats {
    totalUsers: number;
    totalCourts: number;
    totalBookings: number;
    totalRevenue: number;
    activeGroupPlays: number;
    pendingApplications: number;
    pendingReports: number;
    userGrowth: { date: string; count: number }[];
    bookingTrend: { date: string; count: number; revenue: number }[];
    topCourts: { courtId: string; name: string; bookings: number; revenue: number }[];
}