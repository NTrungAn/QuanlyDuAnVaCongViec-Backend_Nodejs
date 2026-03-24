const { Server } = require('socket.io');
const jwtUtil = require('./utils/jwt.util');

let ioInstance = null;

function initSocket(server) {
  ioInstance = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  ioInstance.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Unauthorized'));
      }
      const decoded = jwtUtil.verifyAccessToken(token);
      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error('Unauthorized'));
    }
  });

  ioInstance.on('connection', (socket) => {
    const userId = socket.user?.id;
    if (userId) {
      socket.join(`user:${userId}`);
    }

    socket.on('disconnect', () => {});
  });

  return ioInstance;
}

function getIO() {
  if (!ioInstance) {
    throw new Error('Socket.io has not been initialized');
  }
  return ioInstance;
}

module.exports = {
  initSocket,
  getIO,
};
