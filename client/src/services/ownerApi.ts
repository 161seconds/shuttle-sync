import api from '../api/axiosClient';
import type { SportType } from '../types';

export interface OwnerStats {
    hasVenue: boolean;
    venueId?: string;
    venueName?: string;
    totalCourts: number;
    totalBookings: number;
    totalRevenue: number;
    bookingTrend: { date: string; revenue: number; count: number }[];
    bookingTrendBySport: any[];
    bookingsByStatus: { name: string; value: number }[];
    recentBookings: any[];
    venueSports: string[];
}

export const ownerApi = {
    getVenue: () => api.get('/owner/venue').then(res => res.data.data),
    
    createVenue: (data: {
        name: string;
        location: { type: string, coordinates: number[] };
        address: { street: string; city: string; state: string; countryCode: string; };
        contact: { phone: string; website: string; };
        sports: string[];
        images: string[];
    }) => api.post('/owner/venue', data).then(res => res.data.data),

    updateVenue: (data: Partial<{
        name: string;
        location: { type: string, coordinates: number[] };
        address: { street: string; city: string; state: string; countryCode: string; };
        contact: { phone: string; website: string; };
        sports: string[];
        images: string[];
    }>) => api.put('/owner/venue', data).then(res => res.data.data),

    getStats: (): Promise<OwnerStats> => api.get('/owner/stats').then(res => res.data.data),

    getCourts: () => api.get('/owner/courts').then(res => res.data.data),

    addCourt: (data: {
        name: string;
        sportType: SportType;
        pricePerHour: number;
        status: 'active' | 'inactive' | 'pending_approval' | 'rejected';
    }) => api.post('/owner/courts', data).then(res => res.data.data),

    updateCourt: (courtId: string, data: Partial<{
        name: string;
        sportType: SportType;
        pricePerHour: number;
        status: 'active' | 'inactive' | 'pending_approval' | 'rejected' | 'AVAILABLE' | 'MAINTENANCE';
    }>) => api.put(`/owner/courts/${courtId}`, data).then(res => res.data.data),

    getSchedule: (date: string) => api.get(`/owner/schedule?date=${date}`).then(res => res.data.data),

    blockSlot: (data: {
        subCourtId: string;
        startTime: string;
        endTime: string;
        date: string;
        notes?: string;
    }) => api.post('/owner/schedule/block', data).then(res => res.data.data),

    getBookings: () => api.get('/owner/bookings').then(res => res.data.data),
};
