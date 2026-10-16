import express from 'express';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import helmet from 'helmet';
import { config, isAllowedOrigin } from './config';
import { ApiError } from './utils/ApiError';
import routes from './routes';
import { errorHandler, notFoundHandler, apiLimiter, searchCourtLimiter } from './middlewares';
import cookieParser from 'cookie-parser';

const app = express();


// Security
app.use(helmet());
app.use(cors({
    origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) return callback(null, true);
        return callback(ApiError.forbidden('Origin không được phép'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.set('trust proxy', 1);
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 2000 // Tăng limit lên 2000 cho môi trường dev đỡ bị block
});
app.use(limiter);

app.use(cookieParser());
// Body parsing
app.use(express.json({
    limit: '10mb',
    verify: (req: any, _res, buf) => {
        req.rawBody = buf.toString('utf8');
    }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (!config.isProduction) {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Rate limiting (Global)
app.use('/api', apiLimiter);

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '..', config.upload.dir)));

// 2. Sử dụng cái searchCourtLimiter đã import ở trên
app.use('/api/v1/courts/search', searchCourtLimiter);

// API Routes
app.use('/api/v1', routes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
