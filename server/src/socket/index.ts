import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { SOCKET_EVENTS, SlotStatus, UserRole } from '@shuttle-sync/shared';
import { config } from '../config';
import { TimeSlot } from '../models';
import { logger } from '../utils/logger';

interface AuthSocket extends Socket {
    userId?: string;
    userRole?: UserRole;
}

const courtViewers = new Map<string, Set<string>>();
const slotLockTimers = new Map<string, NodeJS.Timeout>();

export const initializeSocket = (httpServer: HTTPServer): SocketIOServer => {
    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: (origin, callback) => {
                if (!origin) return callback(null, true);
                if (config.cors.allowedOrigins.includes(origin) || !config.isProduction) {
                    return callback(null, true);
                }
                return callback(null, true);
            },
            methods: ['GET', 'POST'],
            credentials: true,
        },
        pingInterval: 25000,
        pingTimeout: 60000,
    });

    // Authentication middleware
    io.use((socket: AuthSocket, next) => {
        let token = socket.handshake.auth.token;

        // Try to get token from cookies if not in auth
        if (!token && socket.request.headers.cookie) {
            const cookies = socket.request.headers.cookie.split(';');
            for (const cookie of cookies) {
                const [name, value] = cookie.trim().split('=');
                if (name === 'accessToken') {
                    token = value;
                    break;
                }
            }
        }

        if (!token) {
            // Allow unauthenticated users to view slots (read-only)
            return next();
        }

        try {
            const decoded = jwt.verify(token, config.jwt.accessSecret) as {
                id?: string;
                userId?: string;
                role: UserRole;
            };
            socket.userId = decoded.userId || decoded.id;
            socket.userRole = decoded.role;
            next();
        } catch {
            next(new Error('Authentication failed'));
        }
    });

    io.on(SOCKET_EVENTS.CONNECTION, (socket: AuthSocket) => {
        logger.debug(`Socket connected: ${socket.id} (user: ${socket.userId || 'guest'})`);

        if (socket.userId) {
            socket.join(`user:${socket.userId}`);
            logger.debug(`Socket ${socket.id} joined user room: user:${socket.userId}`);

            // Broadcast online status to all users
            io.emit(SOCKET_EVENTS.USER_ONLINE, { userId: socket.userId });
        }

        // ============================
        // JOIN/LEAVE COURT ROOM
        // ============================
        socket.on('court:join', (courtId: string) => {
            const room = `court:${courtId}`;
            socket.join(room);

            if (!courtViewers.has(courtId)) {
                courtViewers.set(courtId, new Set());
            }
            courtViewers.get(courtId)!.add(socket.id);

            logger.debug(`Socket ${socket.id} joined court room: ${courtId}`);
        });

        socket.on('court:leave', (courtId: string) => {
            const room = `court:${courtId}`;
            socket.leave(room);

            courtViewers.get(courtId)?.delete(socket.id);
            if (courtViewers.get(courtId)?.size === 0) {
                courtViewers.delete(courtId);
            }
        });

        // ============================
        // SLOT SELECTION (Realtime Lock)
        // ============================
        socket.on(SOCKET_EVENTS.SLOT_SELECT, async (data: {
            courtId: string;
            slotId: string;
        }) => {
            if (!socket.userId) {
                socket.emit('error', { message: 'Bạn cần đăng nhập để chọn sân' });
                return;
            }

            try {
                // Atomic update - only lock if currently available
                const slot = await TimeSlot.findOneAndUpdate(
                    {
                        _id: data.slotId,
                        courtId: data.courtId,
                        status: SlotStatus.AVAILABLE,
                    },
                    {
                        status: SlotStatus.SELECTED,
                        lockedBy: socket.userId,
                        lockedAt: new Date(),
                    },
                    { new: true }
                );

                if (!slot) {
                    socket.emit('error', { message: 'Khung giờ không còn trống' });
                    return;
                }

                // Set auto-release timeout (5 minutes)
                const timerId = setTimeout(async () => {
                    try {
                        await TimeSlot.findOneAndUpdate(
                            { _id: data.slotId, status: SlotStatus.SELECTED, lockedBy: socket.userId },
                            { status: SlotStatus.AVAILABLE, lockedBy: null, lockedAt: null }
                        );

                        io.to(`court:${data.courtId}`).emit(SOCKET_EVENTS.SLOT_RELEASED, {
                            slotId: data.slotId,
                            courtId: data.courtId,
                        });

                        logger.debug(`Slot ${data.slotId} auto-released after timeout`);
                    } catch (err) {
                        logger.error('Auto-release slot error:', err);
                    }
                }, config.slotLock.timeoutMs);

                slotLockTimers.set(data.slotId, timerId);

                // Broadcast to all viewers of this court
                io.to(`court:${data.courtId}`).emit(SOCKET_EVENTS.SLOT_SELECT, {
                    slotId: data.slotId,
                    courtId: data.courtId,
                    lockedBy: socket.userId,
                });

                logger.debug(`Slot ${data.slotId} selected by user ${socket.userId}`);
            } catch (error) {
                logger.error('Slot select error:', error);
                socket.emit('error', { message: 'Không thể chọn khung giờ' });
            }
        });

        // ============================
        // SLOT DESELECTION
        // ============================
        socket.on(SOCKET_EVENTS.SLOT_DESELECT, async (data: {
            courtId: string;
            slotId: string;
        }) => {
            if (!socket.userId) return;

            try {
                const slot = await TimeSlot.findOneAndUpdate(
                    {
                        _id: data.slotId,
                        status: SlotStatus.SELECTED,
                        lockedBy: socket.userId,
                    },
                    {
                        status: SlotStatus.AVAILABLE,
                        lockedBy: null,
                        lockedAt: null,
                    },
                    { new: true }
                );

                if (!slot) return;

                // Clear auto-release timer
                const timer = slotLockTimers.get(data.slotId);
                if (timer) {
                    clearTimeout(timer);
                    slotLockTimers.delete(data.slotId);
                }

                // Broadcast
                io.to(`court:${data.courtId}`).emit(SOCKET_EVENTS.SLOT_RELEASED, {
                    slotId: data.slotId,
                    courtId: data.courtId,
                });

                logger.debug(`Slot ${data.slotId} deselected by user ${socket.userId}`);
            } catch (error) {
                logger.error('Slot deselect error:', error);
            }
        });

        // ============================
        // GROUP PLAY ROOM & CHAT
        // ============================
        socket.on('group_play:join', (groupPlayId: string) => {
            socket.join(`group_play:${groupPlayId}`);
        });

        socket.on('group_play:leave', (groupPlayId: string) => {
            socket.leave(`group_play:${groupPlayId}`);
        });

        socket.on('chat:send', async (data: {
            groupPlayId: string;
            content: string;
            senderName: string;
            senderAvatar?: string;
            replyTo?: {
                messageId: string;
                senderName: string;
                content: string;
            };
        }) => {
            if (!socket.userId) return;

            try {
                // We use dynamic import for ChatMessage to avoid circular dependencies if any
                const { ChatMessage } = await import('../models/ChatMessage');

                const newMessage = new ChatMessage({
                    groupPlayId: data.groupPlayId,
                    senderId: socket.userId,
                    senderName: data.senderName,
                    senderAvatar: data.senderAvatar,
                    content: data.content,
                    replyTo: data.replyTo,
                });

                await newMessage.save();

                io.to(`group_play:${data.groupPlayId}`).emit('chat:message', newMessage);
            } catch (error) {
                logger.error('Chat send error:', error);
            }
        });

        // ============================
        // P2P CHAT (Direct Message)
        // ============================
        socket.on(SOCKET_EVENTS.DIRECT_MESSAGE, async (data: {
            conversationId: string;
            recipientId: string;
            content: string;
            senderName?: string;
            senderAvatar?: string;
            replyTo?: {
                messageId: string;
                senderName: string;
                content: string;
            };
        }) => {
            if (!socket.userId) return;

            try {
                const { Message } = await import('../models/Message');
                const { Conversation } = await import('../models/Conversation');

                const newMessage = new Message({
                    conversationId: data.conversationId,
                    senderId: socket.userId,
                    senderName: data.senderName,
                    senderAvatar: data.senderAvatar,
                    content: data.content,
                    replyTo: data.replyTo,
                });

                await newMessage.save();

                // Ensure recipientId is a string (handle case where frontend accidentally sent an object)
                const recipientStrId = typeof data.recipientId === 'object' && data.recipientId !== null
                    ? ((data.recipientId as any)._id?.toString() || (data.recipientId as any).id?.toString())
                    : String(data.recipientId);

                // Increment unread count for recipient
                const conversation = await Conversation.findById(data.conversationId);
                if (conversation) {
                    const currentCount = conversation.unreadCount.get(recipientStrId) || 0;
                    conversation.unreadCount.set(recipientStrId, currentCount + 1);
                    conversation.lastMessage = newMessage._id;
                    await conversation.save();
                }

                // Emit to recipient
                io.to(`user:${recipientStrId}`).emit(SOCKET_EVENTS.DIRECT_MESSAGE, newMessage);

                // Emit back to sender so their UI updates if they have multiple tabs open
                io.to(`user:${socket.userId}`).emit(SOCKET_EVENTS.DIRECT_MESSAGE, newMessage);
            } catch (error) {
                logger.error('Direct message error:', error);
            }
        });

        // ============================
        // DISCONNECT CLEANUP
        // ============================
        socket.on(SOCKET_EVENTS.DISCONNECT, async () => {
            logger.debug(`Socket disconnected: ${socket.id}`);

            if (socket.userId) {
                // Release all slots locked by this user
                try {
                    const lockedSlots = await TimeSlot.find({
                        lockedBy: socket.userId,
                        status: SlotStatus.SELECTED,
                    });

                    for (const slot of lockedSlots) {
                        await TimeSlot.findByIdAndUpdate(slot._id, {
                            status: SlotStatus.AVAILABLE,
                            lockedBy: null,
                            lockedAt: null,
                        });

                        // Clear timer
                        const timer = slotLockTimers.get(slot._id.toString());
                        if (timer) {
                            clearTimeout(timer);
                            slotLockTimers.delete(slot._id.toString());
                        }

                        // Broadcast release
                        io.to(`court:${slot.courtId}`).emit(SOCKET_EVENTS.SLOT_RELEASED, {
                            slotId: slot._id.toString(),
                            courtId: slot.courtId.toString(),
                        });
                    }

                    if (lockedSlots.length > 0) {
                        logger.debug(`Released ${lockedSlots.length} slots for disconnected user ${socket.userId}`);
                    }
                } catch (error) {
                    logger.error('Disconnect cleanup error:', error);
                }

                // Broadcast offline status
                io.emit(SOCKET_EVENTS.USER_OFFLINE, { userId: socket.userId });
            }

            // Remove from court viewer sets
            for (const [courtId, viewers] of courtViewers) {
                viewers.delete(socket.id);
                if (viewers.size === 0) courtViewers.delete(courtId);
            }
        });
    });

    return io;
};

/**
 * Emit booking event to court viewers
 */
export const emitBookingEvent = (
    io: SocketIOServer,
    courtId: string,
    event: string,
    data: any
) => {
    io.to(`court:${courtId}`).emit(event, data);
};

/**
 * Emit group play event
 */
export const emitGroupPlayEvent = (
    io: SocketIOServer,
    groupPlayId: string,
    event: string,
    data: any
) => {
    io.to(`group_play:${groupPlayId}`).emit(event, data);
};

/**
 * Send notification to specific user
 */
export const emitNotification = (
    io: SocketIOServer,
    userId: string,
    notification: any
) => {
    io.to(`user:${userId}`).emit(SOCKET_EVENTS.NOTIFICATION, notification);
};