import { HubConnectionBuilder } from '@microsoft/signalr';
import { authApi } from '../api/auth.api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
type Listener = (...args: any[]) => void;

class RealtimeSocket {
    private hub = new HubConnectionBuilder().withUrl(`${API_URL}/hubs/realtime`, { withCredentials: true }).withAutomaticReconnect().build();
    private listeners = new Map<string, Set<Listener>>();
    private stopped = false;
    private recovering = false;
    private retried = false;
    private expired = false;
    private retryTimer: ReturnType<typeof setTimeout> | undefined;
    connected = false;

    constructor() {
        this.hub.on('event', (name: string, payload: unknown) => this.dispatch(name, payload));
        this.hub.on('session_expired', () => { this.expired = true; });
        this.hub.onreconnecting(() => { this.connected = false; });
        this.hub.onreconnected(() => this.didConnect());
        this.hub.onclose(() => {
            this.connected = false;
            if (this.stopped) return;
            this.dispatch('disconnect', 'io server disconnect');
            if (this.expired) { this.expired = false; void this.recover(); }
            else this.retryTimer = setTimeout(() => void this.connect(), 3000);
        });
        void this.connect();
    }
    on(name: string, listener: Listener) { if (!this.listeners.has(name)) this.listeners.set(name, new Set()); this.listeners.get(name)!.add(listener); return this; }
    off(name: string, listener?: Listener) { if (listener) this.listeners.get(name)?.delete(listener); else this.listeners.delete(name); return this; }
    private dispatch(name: string, ...args: any[]) { this.listeners.get(name)?.forEach(listener => listener(...args)); }
    private didConnect() { if (this.stopped) { void this.hub.stop(); return; } this.connected = true; this.retried = false; this.dispatch('connect'); }
    async connect() {
        if (this.stopped || this.connected) return;
        try { await this.hub.start(); this.didConnect(); }
        catch (error) {
            if (this.stopped) return;
            const message = error instanceof Error ? error.message : String(error);
            this.dispatch('connect_error', error);
            if (/401|Authentication failed/i.test(message)) {
                if (this.recovering) this.clearSession(); else await this.recover();
            }
            else this.retryTimer = setTimeout(() => void this.connect(), 3000);
        }
    }
    private async recover() {
        if (this.stopped || this.recovering) return;
        if (this.retried) return this.clearSession();
        this.recovering = true; this.retried = true;
        try { await authApi.getMe(); if (!this.stopped) await this.connect(); }
        catch { if (!this.stopped) this.clearSession(); }
        finally { this.recovering = false; }
    }
    private clearSession() { this.disconnect(); window.dispatchEvent(new CustomEvent('auth:unauthorized')); }
    emit(name: string, payload?: unknown) {
        if (!this.connected) { this.dispatch('error', { message: 'Kết nối đang gián đoạn. Vui lòng thử lại.' }); return; }
        void this.hub.invoke('Invoke', name, payload ?? null).catch(error => this.dispatch('error', { message: error instanceof Error ? error.message : String(error) }));
    }
    disconnect() { this.stopped = true; this.connected = false; clearTimeout(this.retryTimer); void this.hub.stop(); }
}

class SocketService {
    private socket: RealtimeSocket | null = null;
    connect(_token: string) { if (!this.socket) this.socket = new RealtimeSocket(); }
    disconnect() { this.socket?.disconnect(); this.socket = null; }
    getSocket() { return this.socket; }
}
export const socketService = new SocketService();
