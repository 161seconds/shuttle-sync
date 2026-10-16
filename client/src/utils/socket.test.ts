import { afterEach, describe, expect, it, vi } from 'vitest';
import { authApi } from '../api/auth.api';
import { socketService } from './socket';

const { handlers, hub } = vi.hoisted(() => {
    const handlers: Record<string, (...args: any[]) => any> = {};
    return { handlers, hub: {
        on: vi.fn((name: string, listener: (...args: any[]) => any) => { handlers[name] = listener; }),
        onclose: vi.fn((listener: (...args: any[]) => any) => { handlers.close = listener; }),
        onreconnecting: vi.fn((listener: (...args: any[]) => any) => { handlers.reconnecting = listener; }),
        onreconnected: vi.fn((listener: (...args: any[]) => any) => { handlers.reconnected = listener; }),
        start: vi.fn().mockResolvedValue(undefined), stop: vi.fn().mockResolvedValue(undefined), invoke: vi.fn().mockResolvedValue(undefined),
    } };
});
vi.mock('@microsoft/signalr', () => ({ HubConnectionBuilder: class { withUrl() { return this; } withAutomaticReconnect() { return this; } build() { return hub; } } }));
vi.mock('../api/auth.api', () => ({ authApi: { getMe: vi.fn() } }));
const flush = () => new Promise(resolve => setTimeout(resolve, 0));
afterEach(() => { socketService.disconnect(); vi.clearAllMocks(); hub.start.mockResolvedValue(undefined); });

describe('SignalR socket compatibility', () => {
    it('preserves named listeners, emission and reconnect joins', async () => {
        socketService.connect(''); const socket = socketService.getSocket()!;
        const message = vi.fn(); const joined = vi.fn(); socket.on('chat:message', message).on('connect', joined);
        await flush(); socket.emit('group_play:join', 'group');
        expect(hub.invoke).toHaveBeenCalledWith('Invoke', 'group_play:join', 'group');
        handlers.event('chat:message', { content: 'hello' }); expect(message).toHaveBeenCalledWith({ content: 'hello' });
        handlers.reconnecting(); expect(socket.connected).toBe(false);
        handlers.reconnected(); expect(socket.connected).toBe(true); expect(joined).toHaveBeenCalledTimes(2);
        socket.off('chat:message', message); handlers.event('chat:message', {}); expect(message).toHaveBeenCalledOnce();
    });
    it('refreshes cookies after explicit session expiry then reconnects', async () => {
        vi.mocked(authApi.getMe).mockResolvedValue({} as any);
        socketService.connect(''); await flush(); handlers.session_expired(); handlers.close(); await flush();
        expect(authApi.getMe).toHaveBeenCalledOnce(); expect(hub.start).toHaveBeenCalledTimes(2);
    });
    it('recovers an expired cookie rejected during the initial handshake', async () => {
        hub.start.mockRejectedValueOnce(new Error('HTTP 401')).mockResolvedValue(undefined);
        vi.mocked(authApi.getMe).mockResolvedValue({} as any);
        socketService.connect(''); await flush();
        expect(authApi.getMe).toHaveBeenCalledOnce();
        expect(hub.start).toHaveBeenCalledTimes(2);
        expect(socketService.getSocket()?.connected).toBe(true);
    });
    it('stops repeated authentication failures after one refresh', async () => {
        hub.start.mockRejectedValue(new Error('HTTP 401'));
        vi.mocked(authApi.getMe).mockResolvedValue({} as any);
        const unauthorized = vi.fn(); window.addEventListener('auth:unauthorized', unauthorized);
        try {
            socketService.connect(''); await flush();
            expect(authApi.getMe).toHaveBeenCalledOnce();
            expect(hub.start).toHaveBeenCalledTimes(2);
            expect(unauthorized).toHaveBeenCalledOnce();
        } finally { window.removeEventListener('auth:unauthorized', unauthorized); }
    });
    it('keeps every event consumed by App and ChatPage unchanged', async () => {
        socketService.connect(''); const socket = socketService.getSocket()!;
        await flush();
        for (const name of ['join_request_received', 'join_request_accepted', 'join_request_rejected', 'user_joined', 'friend:request', 'notification', 'chat:message', 'chat:direct_message']) {
            const listener = vi.fn(); socket.on(name, listener); handlers.event(name, { test: name });
            expect(listener).toHaveBeenCalledWith({ test: name }); socket.off(name, listener);
        }
    });
    it('does not reconnect after logout during refresh', async () => {
        let finish!: (value: any) => void;
        vi.mocked(authApi.getMe).mockReturnValue(new Promise(resolve => { finish = resolve; }));
        socketService.connect(''); await flush(); handlers.session_expired(); handlers.close();
        socketService.disconnect(); finish({}); await flush(); expect(hub.start).toHaveBeenCalledOnce();
    });
    it('clears invalid sessions without an authentication retry loop', async () => {
        vi.mocked(authApi.getMe).mockRejectedValue(new Error('banned'));
        const unauthorized = vi.fn(); window.addEventListener('auth:unauthorized', unauthorized);
        try {
            socketService.connect(''); await flush(); handlers.session_expired(); handlers.close(); await flush();
            expect(unauthorized).toHaveBeenCalledOnce(); expect(hub.start).toHaveBeenCalledOnce();
        } finally { window.removeEventListener('auth:unauthorized', unauthorized); }
    });
});
