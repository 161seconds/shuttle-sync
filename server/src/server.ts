import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './modules/auth/auth.routes.js';
import courtRoutes from './modules/court/court.routes.js';
import bookingRoutes from './modules/booking/booking.routes.js';
import paymentRoutes from './modules/payment/payment.routes.js';

import { setupSockets } from './sockets/bookingSocket.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST", "PATCH"] }
});
setupSockets(io);

app.use(cors());
app.use(express.json());

// Sử dụng Routes
app.use('/api/auth', authRoutes);
app.use('/api/courts', courtRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/badminton_db';
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ DB Admin: Kết nối MongoDB Compass thành công!');
        const PORT = process.env.PORT || 5000;
        server.listen(PORT, () => {
            console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
        });
    })
    .catch(err => console.error('❌ Lỗi kết nối DB:', err));