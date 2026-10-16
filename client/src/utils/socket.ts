import { io, Socket } from 'socket.io-client';
import { authApi } from '../api/auth.api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class SocketService {
    private socket: Socket | null = null;

    connect(token: string) {
        if (!this.socket) {
            this.socket = io(API_URL, {
                auth: { token },
                withCredentials: true,
                forceNew: true,
            });

            let recovering = false;
            let retried = false;
            this.socket.on('connect', () => {
                retried = false;
                console.log('Socket connected');
            });

            const socket = this.socket;
            const clearSession = () => {
                if (this.socket !== socket) return;
                this.disconnect();
                window.dispatchEvent(new CustomEvent('auth:unauthorized'));
            };
            const recoverSession = async () => {
                if (this.socket !== socket || recovering) return;
                if (retried) return clearSession();
                recovering = true;
                retried = true;
                try {
                    await authApi.getMe();
                    if (this.socket === socket) {
                        // Refreshed HTTP-only cookies replace any stale handshake token.
                        socket.auth = {};
                        socket.connect();
                    }
                } catch {
                    clearSession();
                } finally {
                    recovering = false;
                }
            };
            this.socket.on('disconnect', (reason) => {
                console.log('Socket disconnected');
                if (reason === 'io server disconnect') return recoverSession();
            });
            this.socket.on('connect_error', (error) => {
                if (error.message === 'Authentication failed') return recoverSession();
            });
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    getSocket(): Socket | null {
        return this.socket;
    }
}

export const socketService = new SocketService();
