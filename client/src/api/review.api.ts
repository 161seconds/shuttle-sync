import axiosClient from './axiosClient';

export interface ReviewData {
    courtId: string;
    bookingId: string;
    rating: number;
    comment?: string;
    photos?: string[];
}

export const reviewApi = {
    createReview: (data: ReviewData) => {
        return axiosClient.post('/reviews', data);
    },

    getVenueReviews: (venueId: string, params?: { page?: number; limit?: number }) => {
        return axiosClient.get(`/reviews/court/${venueId}`, { params });
    },

    replyToReview: (reviewId: string, comment: string) => {
        return axiosClient.post(`/reviews/${reviewId}/reply`, { comment });
    }
};
