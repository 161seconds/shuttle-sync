import { afterEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { User, GroupPlay } from '../models';
import { Conversation } from '../models/Conversation';
import { Message } from '../models/Message';
import { Tournament } from '../models/Tournament';
import { config } from '../config';
import { authenticate } from '../middlewares/auth';
import { initializeSocket, requireGroupChatMember } from '../socket';
import { tournamentService } from '../services/tournament.service';
import { authController } from '../controllers/auth.controller';
import { authService } from '../services/auth.service';
import { TournamentStatus } from '@shuttle-sync/shared';

const mail = vi.hoisted(() => ({ sendMail: vi.fn().mockResolvedValue({}) }));
vi.mock('nodemailer', () => ({ default: { createTransport: () => mail } }));
const socketHarness = vi.hoisted(() => ({ connect: undefined as any, authenticate: undefined as any, emit: vi.fn(), to: vi.fn() }));
vi.mock('socket.io', () => ({ Server: class {
    use(handler: any) { socketHarness.authenticate = handler; }
    on(_event: string, handler: any) { socketHarness.connect = handler; }
    to(room: string) { socketHarness.to(room); return { emit: socketHarness.emit }; }
    emit() {}
} }));
const id = () => new Types.ObjectId();
afterEach(() => vi.restoreAllMocks());

describe('security regressions', () => {
    it('rejects an active JWT after the account is banned', async () => {
        vi.spyOn(User, 'findById').mockReturnValue({ select: () => ({ lean: async () => ({ status: 'banned', role: 'USER' }) }) } as any);
        const next = vi.fn();
        const token = jwt.sign({ userId: id().toString(), status: 'active' }, config.jwt.accessSecret);
        await authenticate({ cookies: { accessToken: token }, headers: {} } as any, {} as any, next);
        expect(next.mock.calls[0][0].statusCode).toBe(401);
    });
    it('rejects tokens invalidated by a password change', async () => {
        vi.spyOn(User, 'findById').mockReturnValue({ select: () => ({ lean: async () => ({ status: 'active', role: 'USER', tokenVersion: 1 }) }) } as any);
        const next = vi.fn();
        const token = jwt.sign({ userId: id().toString(), status: 'active' }, config.jwt.accessSecret);
        await authenticate({ cookies: { accessToken: token }, headers: {} } as any, {} as any, next);
        expect(next.mock.calls[0][0].statusCode).toBe(401);
    });
    it('persists OTP fields while excluding them from ordinary queries', () => {
        expect(User.schema.path('otpCode').options.select).toBe(false);
        const q = User.findByIdAndUpdate(id(), { otpCode: 'digest', otpExpires: new Date(), otpAttempts: 0 });
        expect((q as any)._castUpdate(q.getUpdate()).$set.otpCode).toBe('digest');
    });
    it('requests OTP for a new account using valid model fields without sending real mail', async () => {
        vi.spyOn(User, 'findOne').mockResolvedValue(null);
        const create = vi.spyOn(User, 'create').mockImplementation((async (data: any) => {
            const user = new User(data);
            await user.validate();
            return user;
        }) as any);
        const update = vi.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({} as any);
        const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
        const next = vi.fn();
        await authController.requestOtp({ body: { email: 'new@example.com' } } as any, res as any, next);
        expect(next).not.toHaveBeenCalled();
        expect(create.mock.calls[0][0]).toMatchObject({ role: 'user', email: 'new@example.com' });
        expect((update.mock.calls[0][1] as any).otpCode).toMatch(/^[a-f0-9]{64}$/);
        expect(mail.sendMail).toHaveBeenCalledOnce();
    });
    it('consumes a matching unexpired OTP atomically, then rejects reuse', async () => {
        const consume = vi.spyOn(User, 'findOneAndUpdate').mockReturnValueOnce({ select: async () => ({ _id: id() }) } as any).mockReturnValueOnce({ select: async () => null } as any);
        vi.spyOn(User, 'updateOne').mockResolvedValue({} as any);
        vi.spyOn(authService, 'createSession').mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
        const res = { cookie: vi.fn(), status: vi.fn().mockReturnThis(), json: vi.fn() };
        const next = vi.fn();
        const req = { body: { email: 'test@example.com', otp: '123456' } };
        await authController.verifyOtpLogin(req as any, res as any, next);
        expect(next).not.toHaveBeenCalled();
        expect(consume.mock.calls[0][0]).toMatchObject({ email: 'test@example.com', otpAttempts: { $lt: 5 }, status: 'active' });
        expect((consume.mock.calls[0][0] as any)?.otpCode).not.toBe('123456');
        expect(consume.mock.calls[0][1]).toMatchObject({ $unset: { otpCode: 1, otpExpires: 1 } });
        await authController.verifyOtpLogin(req as any, res as any, next);
        expect(res.status).toHaveBeenLastCalledWith(400);
    });
    it('rejects guests and nonmembers from group chat', async () => {
        await expect(requireGroupChatMember(id().toString())).rejects.toMatchObject({ statusCode: 403 });
        const query = vi.spyOn(GroupPlay, 'findOne').mockResolvedValue(null);
        const userId = id().toString();
        await expect(requireGroupChatMember(id().toString(), userId)).rejects.toMatchObject({ statusCode: 403 });
        expect(query.mock.calls[0][0]).toMatchObject({ 'participants.userId': userId, isChatDeleted: { $ne: true } });
    });
    it('disconnects socket writes after a ban or token expiry', async () => {
        initializeSocket({} as any);
        let packet: any;
        const socket = { handshake: { auth: {} as any }, request: { headers: {} }, use: (handler: any) => { packet = handler; }, disconnect: vi.fn() };
        const lookup = vi.spyOn(User, 'findById').mockReturnValue({ select: () => ({ lean: async () => ({ status: 'active', role: 'user' }) }) } as any);
        socket.handshake.auth.token = jwt.sign({ userId: id().toString() }, config.jwt.accessSecret, { expiresIn: '1h' });
        const next = vi.fn();
        await socketHarness.authenticate(socket, next);
        expect(next).toHaveBeenCalledWith();
        lookup.mockReturnValue({ select: () => ({ lean: async () => ({ status: 'banned', role: 'user' }) }) } as any);
        await packet(['chat:direct_message', {}], next);
        expect(socket.disconnect).toHaveBeenCalledWith(true);
        expect(next.mock.calls.at(-1)![0]).toBeInstanceOf(Error);
        lookup.mockReturnValue({ select: () => ({ lean: async () => ({ status: 'active', role: 'user' }) }) } as any);
        socket.handshake.auth.token = jwt.sign({ userId: id().toString() }, config.jwt.accessSecret, { expiresIn: '1h' });
        await socketHarness.authenticate(socket, vi.fn());
        vi.spyOn(jwt, 'verify').mockImplementation(() => { throw new jwt.TokenExpiredError('expired', new Date()); });
        socket.disconnect.mockClear();
        await packet(['chat:direct_message', {}], next);
        expect(socket.disconnect).toHaveBeenCalledWith(true);
    });
    it('does not write outsider DMs and derives a valid recipient from the conversation', async () => {
        initializeSocket({} as any);
        const userId = id().toString();
        const handlers: Record<string, any> = {};
        socketHarness.connect({ id: 'socket', userId, join: vi.fn(), on: (event: string, handler: any) => { handlers[event] = handler; } });
        const find = vi.spyOn(Conversation, 'findOne').mockResolvedValueOnce(null);
        const write = vi.spyOn(Message, 'create').mockResolvedValue({ _id: id() } as any);
        const data = { conversationId: id().toString(), recipientId: id().toString(), content: 'hello' };
        await handlers['chat:direct_message'](data);
        expect(write).not.toHaveBeenCalled();
        expect(find.mock.calls[0][0]).toMatchObject({ participants: userId });
        const recipient = id();
        find.mockResolvedValueOnce({ _id: id(), participants: [new Types.ObjectId(userId), recipient] } as any);
        vi.spyOn(User, 'findById').mockReturnValue({ select: async () => ({ displayName: 'Actual sender', avatar: '' }) } as any);
        vi.spyOn(Conversation, 'updateOne').mockResolvedValue({} as any);
        await handlers['chat:direct_message'](data);
        expect(write).toHaveBeenCalledOnce();
        expect(socketHarness.to).toHaveBeenCalledWith(`user:${recipient}`);
        expect(socketHarness.to).not.toHaveBeenCalledWith(`user:${data.recipientId}`);
    });
    it('rejects tournament edits and starts by nonorganizers', async () => {
        vi.spyOn(Tournament, 'findById').mockResolvedValue({ organizerId: id(), matches: [], teams: [] } as any);
        await expect(tournamentService.generateBracket(id().toString(), id().toString())).rejects.toMatchObject({ statusCode: 403 });
        await expect(tournamentService.updateMatch(id().toString(), id().toString(), {}, id().toString())).rejects.toMatchObject({ statusCode: 403 });
    });
    it('distributes five teams without empty matches; advances eight-team semifinal winners separately', async () => {
        const owner = id();
        const tour: any = { _id: id(), organizerId: owner, status: TournamentStatus.DRAFT, matches: [], teams: Array.from({ length: 5 }, () => ({ _id: id() })) };
        vi.spyOn(Tournament, 'findById').mockResolvedValue(tour);
        vi.spyOn(Tournament, 'findOneAndUpdate').mockImplementation(((_filter: any, update: any) => Promise.resolve({ ...tour, ...update.$set })) as any);
        const started = await tournamentService.generateBracket(tour._id.toString(), owner.toString());
        expect(started!.matches.filter((m: any) => m.round === 1).every((m: any) => m.team1Id)).toBe(true);
        expect(started!.matches.filter((m: any) => m.round === 1 && m.winnerId)).toHaveLength(3);
        tour.matches = []; tour.teams = Array.from({ length: 8 }, () => ({ _id: id() }));
        const bracket = await tournamentService.generateBracket(tour._id.toString(), owner.toString());
        const first = bracket!.matches.filter((m: any) => m.round === 1);
        first.forEach((m: any) => { m.winnerId = m.team1Id; });
        (tournamentService as any).advanceAutoWinners(bracket);
        const semis = bracket!.matches.filter((m: any) => m.round === 2);
        semis.forEach((m: any) => { m.winnerId = m.team1Id; });
        (tournamentService as any).advanceAutoWinners(bracket);
        expect(String(bracket!.matches[6].team1Id)).toBe(String(semis[0].winnerId));
        expect(String(bracket!.matches[6].team2Id)).toBe(String(semis[1].winnerId));
        await expect(tournamentService.generateBracket(tour._id.toString(), owner.toString())).rejects.toMatchObject({ statusCode: 409 });
    });
});
