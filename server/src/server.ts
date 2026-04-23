import http from 'http';
import app from './app';
import { config } from './config';
import { connectDB } from './config/database';
import { initializeSocket } from './socket';
import { initCronJobs } from './utils/cron';
import { logger } from './utils/logger';

const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Create HTTP server
        const httpServer = http.createServer(app);

        // Initialize Socket.IO
        const io = initializeSocket(httpServer);

        // Make io accessible in request handlers via app.locals
        app.set('io', io);

        // Initialize cron jobs
        initCronJobs();

        // Start server
        httpServer.listen(config.port, () => {
            logger.info(`
╔══════════════════════════════════════════════════╗
║                                                  ║
║   ShuttleSync API Server                         ║
║                                                  ║
║   Port:        ${config.port}                              ║
║   Environment: ${config.nodeEnv.padEnd(18)}                ║
║   API:     http://localhost:${config.port}/api/v1          ║
║   Socket.IO:   ws://localhost:${config.port}               ║
║                                                  ║
╚══════════════════════════════════════════════════╝
      `);
        });

        // Graceful shutdown
        const shutdown = async (signal: string) => {
            logger.info(`${signal} received. Shutting down gracefully...`);

            httpServer.close(async () => {
                logger.info('HTTP server closed');

                try {
                    const mongoose = await import('mongoose');
                    await mongoose.default.disconnect();
                    logger.info('MongoDB disconnected');
                } catch (err) {
                    logger.error('Error during shutdown:', err);
                }

                process.exit(0);
            });

            // Force shutdown after 10 seconds
            setTimeout(() => {
                logger.error('Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

        // Unhandled rejections
        process.on('unhandledRejection', (reason: Error) => {
            logger.error('Unhandled Rejection:', reason);
        });

        process.on('uncaughtException', (error: Error) => {
            logger.error('Uncaught Exception:', error);
            process.exit(1);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};
export default logger;
startServer();