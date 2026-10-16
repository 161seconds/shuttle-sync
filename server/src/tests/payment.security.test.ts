import { afterEach, describe, expect, it, vi } from 'vitest';
import { paymentController } from '../controllers/payment.controller';
import { bookingService } from '../services/booking.service';
import { Booking } from '../models/Booking';
import { validateBookingRange, bookingDate } from '../services/booking.validation';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

async function webhook(headers: Record<string, string>, overrides = {}) {
    const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
    await paymentController.handleSePayWebhook({ headers, body: { accountNumber: '123', content: 'BK1234567', transferType: 'in', transferAmount: 100000, referenceCode: 'REF1', ...overrides } } as any, res);
    return res;
}

describe('Payment trust boundaries', () => {
    it('rejects self-confirmation before reading the database', async () => {
        const find = vi.spyOn(Booking, 'find');
        await expect(bookingService.confirmPayment('BK1234567', 'user')).rejects.toMatchObject({ statusCode: 403 });
        expect(find).not.toHaveBeenCalled();
    });
    it('fails closed when webhook credentials are not configured', async () => {
        vi.stubEnv('SEPAY_WEBHOOK_SECRET', ''); vi.stubEnv('SEPAY_API_TOKEN', ''); vi.stubEnv('SEPAY_ACCOUNT_NUMBER', '123');
        expect((await webhook({})).status).toHaveBeenCalledWith(503);
    });
    it('rejects omitted signature even with a configured secret', async () => {
        vi.stubEnv('SEPAY_WEBHOOK_SECRET', 'secret'); vi.stubEnv('SEPAY_API_TOKEN', ''); vi.stubEnv('SEPAY_ACCOUNT_NUMBER', '123');
        expect((await webhook({})).status).toHaveBeenCalledWith(401);
    });
    it('rejects omitted token even with a configured API token', async () => {
        vi.stubEnv('SEPAY_WEBHOOK_SECRET', ''); vi.stubEnv('SEPAY_API_TOKEN', 'token'); vi.stubEnv('SEPAY_ACCOUNT_NUMBER', '123');
        expect((await webhook({})).status).toHaveBeenCalledWith(401);
    });
    it('rejects a different recipient and malformed amounts before database access', async () => {
        vi.stubEnv('SEPAY_WEBHOOK_SECRET', ''); vi.stubEnv('SEPAY_API_TOKEN', 'token'); vi.stubEnv('SEPAY_ACCOUNT_NUMBER', '123');
        const find = vi.spyOn(Booking, 'findOne');
        for (const body of [{ accountNumber: '456' }, { transferAmount: '100000' }, { transferAmount: -1 }, { referenceCode: '' }]) {
            expect((await webhook({ authorization: 'Apikey token' }, body)).status).toHaveBeenCalledWith(400);
        }
        expect(find).not.toHaveBeenCalled();
    });
    it('rejects invalid fixed weekdays without entering a loop', async () => {
        const base = { courtId: '507f1f77bcf86cd799439011', subCourtId: '507f1f77bcf86cd799439012', date: '2099-01-01', startTime: '08:00', endTime: '09:00', type: 'fixed', months: 1 };
        for (const daysOfWeek of [[7], [-1], ['1'], [], [1, 1]]) await expect(bookingService.createBooking('user', { ...base, daysOfWeek })).rejects.toMatchObject({ statusCode: 400 });
    });
    it('validates real calendar dates and aligned ranges', () => {
        expect(() => bookingDate('2099-02-30')).toThrow();
        expect(() => validateBookingRange('08:15', '09:00')).toThrow();
        expect(() => validateBookingRange('09:00', '08:00')).toThrow();
        expect(() => validateBookingRange('08:00', '09:30')).not.toThrow();
    });
    it('rejects invalid or reversed history dates before updating bookings', async () => {
        const update = vi.spyOn(Booking, 'updateMany');
        await expect(bookingService.getMyBookings('user', undefined, '2099-01-02', '2099-01-01')).rejects.toMatchObject({ statusCode: 400 });
        await expect(bookingService.getMyBookings('user', undefined, undefined, '2099-02-30')).rejects.toMatchObject({ statusCode: 400 });
        expect(update).not.toHaveBeenCalled();
    });
});
