import { afterEach, describe, expect, it, vi } from 'vitest';
import { authApi } from '../api/auth.api';
import { socketService } from './socket';

const { handlers, socket } = vi.hoisted(() => {
    const handlers: Record<string, (...args: any[]) => any> = {};
    return { handlers, socket: {
        on: vi.fn((event: string, handler: (...args: any[]) => any) => { handlers[event] = handler; }),
        connect: vi.fn(), disconnect: vi.fn(),
    } };
});
vi.mock('socket.io-client', () => ({ io: vi.fn(() => socket) }));
vi.mock('../api/auth.api', () => ({ authApi: { getMe: vi.fn() } }));

afterEach(() => { socketService.disconnect(); vi.clearAllMocks(); });

describe('socket session recovery', () => {
    it('refreshes authentication before reconnecting after server disconnect', async () => {
        vi.mocked(authApi.getMe).mockResolvedValue({} as any);
        socketService.connect('');
        await handlers.disconnect('io server disconnect');
        expect(authApi.getMe).toHaveBeenCalledOnce();
        expect(socket.connect).toHaveBeenCalledOnce();
    });

    it('leaves ordinary transport reconnects to Socket.IO', async () => {
        socketService.connect('');
        await handlers.disconnect('transport close');
        expect(authApi.getMe).not.toHaveBeenCalled();
        expect(socket.connect).not.toHaveBeenCalled();
    });

    it('recovers rejected handshakes once using refreshed cookies', async () => {
        vi.mocked(authApi.getMe).mockResolvedValue({} as any);
        socketService.connect('expired-token');
        await handlers.connect_error(new Error('Authentication failed'));
        expect(authApi.getMe).toHaveBeenCalledOnce();
        expect(socket.connect).toHaveBeenCalledOnce();
        expect((socket as any).auth).toEqual({});
        await handlers.connect_error(new Error('Authentication failed'));
        expect(authApi.getMe).toHaveBeenCalledOnce();
        expect(socket.connect).toHaveBeenCalledOnce();
        expect(socketService.getSocket()).toBeNull();
    });

    it('does not refresh credentials for transport handshake errors', async () => {
        socketService.connect('');
        await handlers.connect_error(new Error('xhr poll error'));
        expect(authApi.getMe).not.toHaveBeenCalled();
    });

    it('allows another recovery after a successful connection', async () => {
        vi.mocked(authApi.getMe).mockResolvedValue({} as any);
        socketService.connect('');
        await handlers.connect_error(new Error('Authentication failed'));
        handlers.connect();
        await handlers.disconnect('io server disconnect');
        expect(authApi.getMe).toHaveBeenCalledTimes(2);
        expect(socket.connect).toHaveBeenCalledTimes(2);
    });

    it.each(['disconnect', 'connect_error'])('never reconnects after logout during %s recovery', async (event) => {
        let finish!: (value: any) => void;
        vi.mocked(authApi.getMe).mockReturnValue(new Promise(resolve => { finish = resolve; }));
        socketService.connect('');
        const recovering = handlers[event](event === 'disconnect' ? 'io server disconnect' : new Error('Authentication failed'));
        socketService.disconnect();
        finish({});
        await recovering;
        expect(socket.connect).not.toHaveBeenCalled();
    });

    it('clears rejected sessions instead of reconnecting', async () => {
        vi.mocked(authApi.getMe).mockRejectedValue(new Error('banned'));
        const unauthorized = vi.fn();
        window.addEventListener('auth:unauthorized', unauthorized);
        try {
            socketService.connect('');
            await handlers.disconnect('io server disconnect');
            expect(socketService.getSocket()).toBeNull();
            expect(socket.connect).not.toHaveBeenCalled();
            expect(unauthorized).toHaveBeenCalledOnce();
        } finally {
            window.removeEventListener('auth:unauthorized', unauthorized);
        }
    });
});
