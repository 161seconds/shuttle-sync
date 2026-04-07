import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './modules/auth/auth.routes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Sử dụng Routes
app.use('/api/auth', authRoutes);

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/badminton_db';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ DB Admin: Kết nối MongoDB Compass thành công!');
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`🚀 Server running at http://localhost:${PORT}`);
        });
    })
    .catch(err => console.error('❌ Lỗi kết nối DB:', err));