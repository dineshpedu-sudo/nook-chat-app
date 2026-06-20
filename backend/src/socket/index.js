import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

// Tracks which socket belongs to which user, so we know who's online
// and where to deliver a message in real time.
const onlineUsers = new Map(); // userId -> socketId

export function registerSocketHandlers(io) {
  // Every socket connection must present a valid JWT before it's allowed through.
  // This mirrors requireAuth, but for the WebSocket side of the app.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = payload.userId;
      socket.username = payload.username;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    onlineUsers.set(socket.userId, socket.id);
    io.emit('presence:update', { userId: socket.userId, online: true });

    socket.on('message:send', async ({ receiverId, content }, ack) => {
      if (!receiverId || typeof content !== 'string' || !content.trim()) {
        return ack?.({ error: 'Invalid message' });
      }

      try {
        const message = await prisma.message.create({
          data: {
            content: content.trim(),
            senderId: socket.userId,
            receiverId,
          },
        });

        // Deliver to the receiver instantly if they're online right now
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('message:new', message);
        }

        // Confirm delivery back to the sender so their own UI updates too
        ack?.({ message });
      } catch (err) {
        console.error('Send message error:', err.message);
        ack?.({ error: 'Could not send message' });
      }
    });

    socket.on('typing', ({ receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typing', { userId: socket.userId });
      }
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(socket.userId);
      io.emit('presence:update', { userId: socket.userId, online: false });
    });
  });
}

export function isUserOnline(userId) {
  return onlineUsers.has(userId);
}
