export type UserRole = 'user' | 'admin';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface User {
    _id?: string;
    name: string;
    email: string;
    password?: string;
    role: UserRole;
}

export interface Court {
    _id?: string;
    name: string;
    location: string;
    pricePerHour: number;
    imageUrl?: string;
}

export interface Booking {
    _id?: string;
    userId: string;
    courtId: string;
    date: string; // Định dạng YYYY-MM-DD
    timeSlot: string; // Ví dụ: "08:00 - 09:00"
    status: BookingStatus;
    paymentStatus: 'unpaid' | 'paid';
}