const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;
const userSockets = new Map(); // userId -> Set(socketIds)

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const secret = process.env.ACCESS_TOKEN_SECRET;
      if (!secret) {
        console.error('❌ ACCESS_TOKEN_SECRET is not defined in .env');
        return next(new Error('Server configuration error'));
      }
      const decoded = jwt.verify(token, secret);
      socket.userId = decoded.id; 
      console.log(`✅ Socket authenticated for user: ${socket.userId}`);
      next();
    } catch (err) {
      console.error(`❌ Socket authentication failed: ${err.message}`);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`🔌 User connected to socket: ${userId} (${socket.id})`);

    // Lưu socketId cho userId này
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);

    socket.on('disconnect', () => {
      console.log(`❌ User disconnected from socket: ${userId} (${socket.id})`);
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
        }
      }
    });
  });

  return io;
};

const sendNotification = (recipientId, notification) => {
  if (!io) return;

  const sockets = userSockets.get(recipientId.toString());
  if (sockets) {
    sockets.forEach((socketId) => {
      io.to(socketId).emit('notification:new', notification);
    });
    console.log(`🚀 Sent realtime notification to user: ${recipientId}`);
  } else {
    console.log(`⚠️ User ${recipientId} is offline, skipping realtime emit`);
  }
};

module.exports = {
  initSocket,
  sendNotification,
};
