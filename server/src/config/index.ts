import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',

    mongo: {
        uri: process.env.MONGO_URI || 'mongodb://localhost:27017/shuttle_sync',
    },

    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
        accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },

    google: {
        mapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
        placesApiKey: process.env.GOOGLE_PLACES_API_KEY || '',
    },

    client: {
        url: process.env.CLIENT_URL || 'http://localhost:5173',
    },

    upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
        dir: process.env.UPLOAD_DIR || 'uploads',
    },

    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },

    slotLock: {
        timeoutMs: parseInt(process.env.SLOT_LOCK_TIMEOUT_MS || '300000', 10),
        paymentTimeoutMs: parseInt(process.env.PAYMENT_TIMEOUT_MS || '900000', 10),
    },
} as const;