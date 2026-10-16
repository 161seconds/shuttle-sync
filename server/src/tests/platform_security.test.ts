import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import { z } from 'zod';
import { validate } from '../middlewares/validate';
import { config, isAllowedOrigin } from '../config';
import { adminService } from '../services/admin.service';
import { OwnerApplication, User, Venue, Notification } from '../models';
import { Venue as VenueModel } from '../models/Venue.model';
import { registerSchema, searchCourtSchema } from '../validators';

vi.mock('../socket', () => ({ disconnectUserSockets: vi.fn() }));

afterEach(() => vi.restoreAllMocks());

describe('platform request boundaries', () => {
    it('preserves owner registration while rejecting admin self-registration', () => {
        const body = { email: 'owner@example.com', password: 'ValidPass123', displayName: 'Owner' };
        for (const role of ['USER', 'OWNER', 'user', 'court_owner']) {
            expect(registerSchema.parse({ body: { ...body, role } }).body.role).toBe(role);
        }
        for (const role of ['admin', 'ADMIN']) {
            expect(registerSchema.safeParse({ body: { ...body, role } }).success).toBe(false);
        }
    });

    it('keeps the HTTP false filter false after request parsing', async () => {
        const request: any = { query: { isIndoor: 'false' }, body: {}, params: {} };
        const next = vi.fn();
        await validate(searchCourtSchema)(request, {} as any, next);
        expect(next).toHaveBeenCalledWith();
        expect(request.query.isIndoor).toBe(false);
    });

    it('rejects untrusted origins, allowing exact configured origins and server requests', () => {
        expect(isAllowedOrigin()).toBe(true);
        for (const origin of config.cors.allowedOrigins) expect(isAllowedOrigin(origin)).toBe(true);
        expect(isAllowedOrigin('https://attacker.invalid')).toBe(false);
        expect(isAllowedOrigin(`${config.cors.allowedOrigins[0]}.attacker.invalid`)).toBe(false);
        expect(isAllowedOrigin('null')).toBe(false);
    });

    it('passes parsed numbers, defaults and stripped fields to controllers', async () => {
        const request: any = { body: { amount: '10', admin: true }, query: { page: '2' }, params: {} };
        const next = vi.fn();
        await validate(z.object({
            body: z.object({ amount: z.coerce.number().positive(), note: z.string().default('') }),
            query: z.object({ page: z.coerce.number().int().positive() }),
        }))(request, {} as any, next);
        expect(next).toHaveBeenCalledWith();
        expect(request.body).toEqual({ amount: 10, note: '' });
        expect(request.query).toEqual({ page: 2 });
    });

    it('stops invalid data before a controller runs', async () => {
        const next = vi.fn();
        await validate(z.object({ body: z.object({ amount: z.coerce.number().positive() }) }))(
            { body: { amount: '-1' } } as any, {} as any, next,
        );
        expect(next.mock.calls[0][0]).toBeInstanceOf(z.ZodError);
    });
});

describe('owner approval transaction contract', () => {
    const session = {} as any;
    let application: any;
    let transaction: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        application = {
            userId: new mongoose.Types.ObjectId(), status: 'pending', courtName: 'Local court',
            sportTypes: ['badminton'], courtAddress: { street: '1 Street', ward: 'Ward', district: 'District' },
            courtLocation: { lng: 106, lat: 10 }, courtPhotos: ['photo'], save: vi.fn().mockResolvedValue(undefined),
        };
        transaction = vi.spyOn(mongoose.connection, 'transaction').mockImplementation(async (callback: any) => callback(session));
        vi.spyOn(OwnerApplication, 'findById').mockReturnValue({ session: vi.fn().mockResolvedValue(application) } as any);
        vi.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({ phone: '0900000000' } as any);
        vi.spyOn(Venue, 'findOne').mockReturnValue({ session: vi.fn().mockResolvedValue(null) } as any);
        vi.spyOn(Venue, 'create').mockResolvedValue([] as any);
        vi.spyOn(Notification, 'create').mockResolvedValue([] as any);
    });

    const approve = () => adminService.reviewOwnerApplication(new mongoose.Types.ObjectId().toString(), new mongoose.Types.ObjectId().toString(), 'approved');

    it('creates a schema-valid current Venue with every write in the same transaction', async () => {
        await approve();
        expect(transaction).toHaveBeenCalledOnce();
        expect(User.findByIdAndUpdate).toHaveBeenCalledWith(application.userId, { role: 'court_owner' }, { new: true, session });
        const [venues, options] = vi.mocked(Venue.create).mock.calls[0] as any;
        expect(options).toEqual({ session });
        expect(new VenueModel(venues[0]).validateSync()).toBeUndefined();
        expect(venues[0].sports).toEqual(['BADMINTON']);
        expect(application.save).toHaveBeenCalledWith({ session });
        expect(vi.mocked(Notification.create).mock.calls[0][1]).toEqual({ session });
    });

    it('does not duplicate venues or notifications for repeated approval', async () => {
        application.status = 'approved';
        await approve();
        expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
        expect(Venue.create).not.toHaveBeenCalled();
        expect(Notification.create).not.toHaveBeenCalled();
    });

    it('propagates failed writes to the transaction so MongoDB can roll back', async () => {
        vi.mocked(Venue.create).mockRejectedValueOnce(new Error('venue write failed'));
        await expect(approve()).rejects.toThrow('venue write failed');
        expect(application.save).not.toHaveBeenCalled();
        expect(Notification.create).not.toHaveBeenCalled();
    });
});
