import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import { Booking, Court, Venue, User, OwnerApplication, Notification, GroupPlay } from '../models';
import { Voucher } from '../models/Voucher';
import { bookingService } from '../services/booking.service';
import { ownerService } from '../services/owner.service';
import { adminService } from '../services/admin.service';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth';
import { config } from '../config';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import http from 'http';
import app from '../app';

const uri = process.env.MONGO_TEST_URI;
const database = `shuttle_test_${process.pid}_${Date.now()}`;
const objectId = () => new mongoose.Types.ObjectId();

describe.skipIf(!uri)('MongoDB schedule and security regressions', () => {
    let owner: any, venue: any, court: any;
    let server: http.Server;
    let baseUrl: string;
    const date = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
    const request = (extra = {}) => ({ courtId: venue._id.toString(), subCourtId: court._id.toString(), date, startTime: '08:00', endTime: '09:00', ...extra });
    const user = () => User.create({ email: `${objectId()}@example.test`, displayName: 'Player' });

    beforeAll(async () => {
        await mongoose.connect(uri!, { dbName: database });
        await Promise.all([Booking, Court, Venue, User, OwnerApplication, Notification, GroupPlay, Voucher].map(model => model.init()));
        server = app.listen(0, '127.0.0.1');
        await new Promise<void>(resolve => server.once('listening', resolve));
        baseUrl = `http://127.0.0.1:${(server.address() as any).port}/api/v1`;
    }, 30000);
    beforeEach(async () => {
        await Promise.all(Object.values(mongoose.models).map(model => model.deleteMany({})));
        owner = await User.create({ email: 'owner@example.test', displayName: 'Owner', role: 'court_owner' });
        venue = await Venue.create({ name: 'Test venue', ownerId: owner._id, sports: ['BADMINTON'] });
        court = await Court.create({ venueId: venue._id, name: 'Court 1', sportType: 'BADMINTON', pricePerHour: 100000 });
    });
    afterAll(async () => {
        vi.restoreAllMocks();
        if (server) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
        if (mongoose.connection.name === database) await mongoose.connection.dropDatabase();
        await mongoose.disconnect();
    });

    it('accepts exactly one of five concurrent overlapping bookings', async () => {
        const users = await Promise.all(Array.from({ length: 5 }, user));
        const results = await Promise.allSettled(users.map(player => bookingService.createBooking(player._id.toString(), request())));
        expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
        expect(await Booking.countDocuments({ status: 'pending_payment' })).toBe(1);
    }, 30000);

    it('serializes owner blocks with customer bookings and rejects rescheduling into occupied time', async () => {
        const player = await user();
        const results = await Promise.allSettled([
            bookingService.createBooking(player._id.toString(), request()),
            ownerService.blockSlot(owner._id.toString(), request()),
        ]);
        expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
        const later = await ownerService.blockSlot(owner._id.toString(), request({ startTime: '10:00', endTime: '11:00' }));
        await expect(ownerService.updateBooking(owner._id.toString(), later._id.toString(), { startTime: '08:00', endTime: '09:00' })).rejects.toThrow();
        expect((await Booking.findById(later._id))!.startTime).toBe('10:00');
    }, 30000);

    it('rejects malformed fixed bookings and mismatched venues before writing', async () => {
        const player = await user();
        await expect(bookingService.createBooking(player._id.toString(), request({ type: 'fixed', months: 1, daysOfWeek: [7] }))).rejects.toMatchObject({ statusCode: 400 });
        const other = await Venue.create({ name: 'Other venue' });
        await expect(bookingService.createBooking(player._id.toString(), request({ courtId: other._id.toString() }))).rejects.toMatchObject({ statusCode: 400 });
        expect(await Booking.countDocuments()).toBe(0);
    });

    it('validates payment amount, deduplicates transaction IDs, rejects expired orders', async () => {
        const player = await user();
        const pending = await bookingService.createBooking(player._id.toString(), request());
        await expect(bookingService.confirmPayment(pending.bookingCode, player._id.toString())).rejects.toMatchObject({ statusCode: 403 });
        await expect(bookingService.confirmPayment(pending.bookingCode, player._id.toString(), { id: 'BANK-1', amount: 1 })).rejects.toMatchObject({ statusCode: 400 });
        await bookingService.confirmPayment(pending.bookingCode, player._id.toString(), { id: 'BANK-1', amount: pending.finalAmount });
        await bookingService.confirmPayment(pending.bookingCode, player._id.toString(), { id: 'BANK-1', amount: pending.finalAmount });
        expect((await Booking.findById(pending.bookings[0]._id))!.payment.status).toBe('paid');
        const second = await bookingService.createBooking(player._id.toString(), request({ startTime: '10:00', endTime: '11:00' }));
        await expect(bookingService.confirmPayment(second.bookingCode, player._id.toString(), { id: 'BANK-1', amount: second.finalAmount })).rejects.toMatchObject({ statusCode: 409 });
        await Booking.updateOne({ _id: second.bookings[0]._id }, { 'payment.expiresAt': new Date(0) });
        await expect(bookingService.confirmPayment(second.bookingCode, player._id.toString(), { id: 'BANK-2', amount: second.finalAmount })).rejects.toMatchObject({ statusCode: 409 });
    });

    it('pays all recurring sessions atomically and retries without duplicate transaction or notifications', async () => {
        const player = await user();
        const pending = await bookingService.createBooking(player._id.toString(), request({
            type: 'fixed', months: 1, daysOfWeek: [new Date(date).getUTCDay()],
        }));
        expect(pending.bookings).toHaveLength(4);
        expect(pending.bookingCode).toMatch(/^GRP/);
        expect(pending.finalAmount).toBe(400000);
        const dates = pending.bookings.map(booking => booking.date.toISOString().slice(0, 10));
        expect(dates[0]).toBe(date);
        expect(await bookingService.getCourtBookings(venue._id.toString(), date)).toHaveLength(1);
        expect(await bookingService.getMyBookings(player._id.toString(), undefined, date, date)).toHaveLength(1);
        await expect(bookingService.getMyBookings(player._id.toString(), undefined, '2026-02-30', date)).rejects.toMatchObject({ statusCode: 400 });
        await expect(bookingService.getMyBookings(player._id.toString(), undefined, dates[1], date)).rejects.toMatchObject({ statusCode: 400 });
        const transaction = { id: 'GROUP-TRANSFER', amount: pending.finalAmount };
        await Promise.all([
            bookingService.confirmPayment(pending.bookingCode, player._id.toString(), transaction),
            bookingService.confirmPayment(pending.bookingCode, player._id.toString(), transaction),
        ]);
        expect(await Booking.countDocuments({ groupId: pending.bookingCode, status: 'confirmed', 'payment.status': 'paid' })).toBe(4);
        expect(await Booking.countDocuments({ 'payment.transactionId': transaction.id })).toBe(1);
        expect(await Notification.countDocuments({ title: 'Thanh toán thành công' })).toBe(2);
    }, 30000);

    it('limits voucher redemption across courts and rolls back invalid redemption', async () => {
        const secondCourt = await Court.create({ venueId: venue._id, name: 'Court 2', sportType: 'BADMINTON', pricePerHour: 100000 });
        const voucher = await Voucher.create({ code: 'ONEUSE', discountType: 'fixed', discountValue: 10000,
            startDate: new Date(Date.now() - 86400000), endDate: new Date(Date.now() + 86400000),
            usageLimit: 1, status: 'APPROVED', minOrderValue: 200000 });
        const players = await Promise.all([user(), user()]);
        await expect(bookingService.createBooking(players[0]._id.toString(), request({ voucherCode: voucher.code }))).rejects.toThrow();
        expect((await Voucher.findById(voucher._id))!.usedCount).toBe(0);
        expect(await Booking.countDocuments()).toBe(0);
        await Voucher.updateOne({ _id: voucher._id }, { minOrderValue: 0 });
        const results = await Promise.allSettled(players.map((player, index) => bookingService.createBooking(player._id.toString(), request({
            subCourtId: index === 0 ? court._id.toString() : secondCourt._id.toString(), voucherCode: voucher.code,
        }))));
        expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
        expect((await Voucher.findById(voucher._id))!.usedCount).toBe(1);
        const bookings = await Booking.find();
        expect(bookings).toHaveLength(1);
        expect(bookings[0].finalAmount).toBe(90000);
    }, 30000);

    it('cancels only the owner of an unpaid order without resurrecting it on late payment', async () => {
        const player = await user();
        const other = await user();
        const pending = await bookingService.createBooking(player._id.toString(), request());
        const id = pending.bookings[0]._id.toString();
        await expect(bookingService.cancelBooking(id, other._id.toString(), 'test')).rejects.toMatchObject({ statusCode: 404 });
        await bookingService.cancelBooking(id, player._id.toString(), 'test');
        expect((await Booking.findById(id))!.status).toBe('cancelled');
        await expect(bookingService.confirmPayment(pending.bookingCode, player._id.toString(), { id: 'LATE', amount: pending.finalAmount })).rejects.toMatchObject({ statusCode: 409 });
    });

    it('keeps paid completed revenue when the player reads history', async () => {
        const player = await user();
        const pending = await bookingService.createBooking(player._id.toString(), request());
        await bookingService.confirmPayment(pending.bookingCode, player._id.toString(), { id: 'REVENUE', amount: pending.finalAmount });
        await Booking.updateOne({ _id: pending.bookings[0]._id }, { date: new Date(Date.now() - 86400000) });
        const before = await ownerService.getDashboardStats(owner._id.toString());
        await bookingService.getMyBookings(player._id.toString());
        const after = await ownerService.getDashboardStats(owner._id.toString());
        expect(before.totalRevenue).toBe(pending.finalAmount);
        expect(after.totalRevenue).toBe(before.totalRevenue);
    });

    it('approves the current Venue schema once and rolls back all writes on failure', async () => {
        const applicant = await user();
        const application = await OwnerApplication.create({
            userId: applicant._id, courtName: 'Applicant court', identityDocument: 'proof', courtPhotos: [], sportTypes: ['badminton'],
            courtAddress: { street: '1 Street', ward: 'Ward', district: 'District', fullAddress: '1 Street, District' },
            courtLocation: { lat: 10, lng: 106 },
        });
        const fail = vi.spyOn(Notification, 'create').mockRejectedValueOnce(new Error('forced notification failure'));
        await expect(adminService.reviewOwnerApplication(application._id.toString(), owner._id.toString(), 'approved')).rejects.toThrow('forced notification failure');
        fail.mockRestore();
        expect((await User.findById(applicant._id))!.role).toBe('user');
        expect((await OwnerApplication.findById(application._id))!.status).toBe('pending');
        expect(await Venue.countDocuments({ ownerId: applicant._id })).toBe(0);
        await adminService.reviewOwnerApplication(application._id.toString(), owner._id.toString(), 'approved');
        await adminService.reviewOwnerApplication(application._id.toString(), owner._id.toString(), 'approved');
        expect(await Venue.countDocuments({ ownerId: applicant._id })).toBe(1);
        expect((await User.findById(applicant._id))!.role).toBe('court_owner');
    });

    it('consumes an OTP once and immediately revokes a banned JWT', async () => {
        const player = await user();
        await User.updateOne({ _id: player._id }, { otpCode: crypto.createHash('sha256').update('123456').digest('hex'), otpExpires: new Date(Date.now() + 60000), otpAttempts: 0 });
        const res = { cookie: vi.fn(), status: vi.fn().mockReturnThis(), json: vi.fn() };
        const next = vi.fn();
        await authController.verifyOtpLogin({ body: { email: player.email, otp: '123456' } } as any, res as any, next);
        expect(next).not.toHaveBeenCalled();
        expect(res.cookie).toHaveBeenCalledTimes(2);
        await authController.verifyOtpLogin({ body: { email: player.email, otp: '123456' } } as any, res as any, next);
        expect(res.status).toHaveBeenLastCalledWith(400);
        const token = jwt.sign({ userId: player._id, status: 'active' }, config.jwt.accessSecret);
        await adminService.banUser(player._id.toString(), owner._id.toString(), 'test');
        const forbidden = vi.fn();
        await authenticate({ cookies: { accessToken: token }, headers: {} } as any, {} as any, forbidden);
        expect(forbidden.mock.calls[0][0].statusCode).toBe(401);
    });

    it('enforces CORS, payment authority and tournament authentication through HTTP routes', async () => {
        const blocked = await fetch(`${baseUrl}/health`, { headers: { Origin: 'https://attacker.invalid' } });
        expect(blocked.status).toBe(403);
        expect(blocked.headers.get('access-control-allow-origin')).toBeNull();
        const guest = await fetch(`${baseUrl}/tournaments/${objectId()}/start`, { method: 'POST' });
        expect(guest.status).toBe(401);
        const player = await user();
        const pending = await bookingService.createBooking(player._id.toString(), request());
        const token = jwt.sign({ userId: player._id, tokenVersion: 0 }, config.jwt.accessSecret);
        const confirm = await fetch(`${baseUrl}/bookings/${pending.bookingCode}/confirm-payment`, {
            method: 'POST', headers: { Cookie: `accessToken=${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ transaction: { id: 'FORGED', amount: pending.finalAmount } }),
        });
        expect(confirm.status).toBe(403);
        expect((await Booking.findById(pending.bookings[0]._id))!.payment.status).toBe('pending');
        const cancel = await fetch(`${baseUrl}/bookings/${pending.bookings[0]._id}/cancel`, {
            method: 'POST', headers: { Cookie: `accessToken=${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: 'HTTP cancellation' }),
        });
        expect(cancel.status).toBe(200);
        expect((await Booking.findById(pending.bookings[0]._id))!.status).toBe('cancelled');
    });
});
