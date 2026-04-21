// ========================
// USER & AUTH
// ========================
export enum UserRole {
    USER = 'user',
    COURT_OWNER = 'court_owner',
    ADMIN = 'admin',
}

export enum UserStatus {
    ACTIVE = 'active',
    BANNED = 'banned',
    PENDING_VERIFICATION = 'pending_verification',
}

export enum AuthProvider {
    LOCAL = 'local',
    GOOGLE = 'google',
}

// ========================
// COURT
// ========================
export enum SportType {
    BADMINTON = 'badminton',
    PICKLEBALL = 'pickleball',
}

export enum CourtStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    PENDING_APPROVAL = 'pending_approval',
    REJECTED = 'rejected',
}

export enum SlotStatus {
    AVAILABLE = 'available',
    SELECTED = 'selected',    // realtime lock (someone is selecting)
    BOOKED = 'booked',
    EXPIRED = 'expired',
}

// ========================
// BOOKING
// ========================
export enum BookingStatus {
    PENDING_PAYMENT = 'pending_payment',
    CONFIRMED = 'confirmed',
    CANCELLED = 'cancelled',
    COMPLETED = 'completed',
    NO_SHOW = 'no_show',
}

export enum BookingType {
    CASUAL = 'casual',           // Đặt sân bình thường
    GROUP_PLAY = 'group_play',   // Đánh vãng lai (tìm người đánh cùng)
    TOURNAMENT = 'tournament',   // Tổ chức giải đấu
}

export enum PaymentStatus {
    PENDING = 'pending',
    PAID = 'paid',
    REFUNDED = 'refunded',
    FAILED = 'failed',
}

export enum PaymentMethod {
    QR_CODE = 'qr_code',
    BANK_TRANSFER = 'bank_transfer',
    CASH = 'cash',
}

// ========================
// GROUP PLAY (Vãng lai)
// ========================
export enum GroupPlayStatus {
    OPEN = 'open',           // Đang tìm người
    FULL = 'full',           // Đã đủ người
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

export enum GroupPlayRole {
    ORGANIZER = 'organizer',
    PARTICIPANT = 'participant',
}

export enum SkillLevel {
    BEGINNER = 'beginner',
    INTERMEDIATE = 'intermediate',
    ADVANCED = 'advanced',
    PROFESSIONAL = 'professional',
}

// ========================
// TOURNAMENT
// ========================
export enum TournamentStatus {
    DRAFT = 'draft',
    REGISTRATION_OPEN = 'registration_open',
    REGISTRATION_CLOSED = 'registration_closed',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

export enum TournamentFormat {
    SINGLE_ELIMINATION = 'single_elimination',
    DOUBLE_ELIMINATION = 'double_elimination',
    ROUND_ROBIN = 'round_robin',
}

// ========================
// COURT OWNER APPLICATION
// ========================
export enum OwnerApplicationStatus {
    PENDING = 'pending',
    UNDER_REVIEW = 'under_review',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    REQUIRES_MORE_INFO = 'requires_more_info',
}

// ========================
// EVENT / VOUCHER
// ========================
export enum EventType {
    TOURNAMENT = 'tournament',
    VOUCHER = 'voucher',
    PROMOTION = 'promotion',
    ANNOUNCEMENT = 'announcement',
}

export enum VoucherType {
    PERCENTAGE = 'percentage',
    FIXED_AMOUNT = 'fixed_amount',
    FREE_SLOT = 'free_slot',
}

// ========================
// REPORT
// ========================
export enum ReportReason {
    SPAM = 'spam',
    HARASSMENT = 'harassment',
    NO_SHOW = 'no_show',
    INAPPROPRIATE_BEHAVIOR = 'inappropriate_behavior',
    FAKE_COURT = 'fake_court',
    OTHER = 'other',
}

export enum ReportStatus {
    PENDING = 'pending',
    REVIEWING = 'reviewing',
    RESOLVED = 'resolved',
    DISMISSED = 'dismissed',
}

// ========================
// SOCKET EVENTS
// ========================
export const SOCKET_EVENTS = {
    // Connection
    CONNECTION: 'connection',
    DISCONNECT: 'disconnect',

    // Slot realtime
    SLOT_SELECT: 'slot:select',
    SLOT_DESELECT: 'slot:deselect',
    SLOT_BOOKED: 'slot:booked',
    SLOT_RELEASED: 'slot:released',
    SLOT_STATE_SYNC: 'slot:state_sync',

    // Court updates
    COURT_UPDATED: 'court:updated',

    // Booking
    BOOKING_CREATED: 'booking:created',
    BOOKING_CANCELLED: 'booking:cancelled',
    BOOKING_CONFIRMED: 'booking:confirmed',

    // Group Play
    GROUP_PLAY_CREATED: 'group_play:created',
    GROUP_PLAY_JOINED: 'group_play:joined',
    GROUP_PLAY_LEFT: 'group_play:left',
    GROUP_PLAY_FULL: 'group_play:full',
    GROUP_PLAY_UPDATED: 'group_play:updated',

    // Notifications
    NOTIFICATION: 'notification',

    // Admin
    ADMIN_BROADCAST: 'admin:broadcast',
} as const;

// ========================
// API RESPONSE
// ========================
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
} as const;

// ========================
// PAGINATION
// ========================
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
} as const;

// ========================
// SLOT LOCK TIMEOUT
// ========================
export const SLOT_LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 phút
export const PAYMENT_TIMEOUT_MS = 15 * 60 * 1000; // 15 phút