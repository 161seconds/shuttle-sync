import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import { config } from './config';
import routes from './routes';
import { errorHandler, notFoundHandler, apiLimiter, searchCourtLimiter } from './middlewares';

const app = express();

// Security
app.use(helmet());
app.use(cors({
    origin: config.client.url,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
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