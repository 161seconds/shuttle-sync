import { io, Socket } from 'socket.io-client';

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

            this.socket.on('connect', () => {
                console.log('Socket connected');
            });

            this.socket.on('disconnect', () => {
                console.log('Socket disconnected');
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
