import { Server, Socket } from 'socket.io';

export const setupSockets = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        console.log('⚡ Một Client vừa kết nối:', socket.id);

        socket.on('join_court', (courtId: string) => {
            socket.join(courtId);
            console.log(`User ${socket.id} đang xem sân: ${courtId}`);
        });

        // Khi user rời trang
        socket.on('leave_court', (courtId: string) => {
            socket.leave(courtId);
        });

        socket.on('disconnect', () => {
            console.log('❌ Client đã ngắt kết nối:', socket.id);
        });
    });
};