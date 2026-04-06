require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const User = require('./models/User.model');
const Role = require('./models/Role.model');
const bcrypt = require('bcrypt');
const { verifyAccessToken } = require('./utils/jwt.util');

const PORT = process.env.PORT || 3000;

async function seedData() {
  try {
    let adminRole = await Role.findOne({ name: 'ADMIN' });
    if (!adminRole) {
      adminRole = await Role.create({ name: 'ADMIN', description: 'Quản trị viên hệ thống' });
    }

    let userRole = await Role.findOne({ name: 'USER' });
    if (!userRole) {
      userRole = await Role.create({ name: 'USER', description: 'Người dùng mặc định' });
    }

    const adminExists = await User.findOne({ email: 'admin@pm.com' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        email: 'admin@pm.com',
        password: hashedPassword,
        fullName: 'Admin Default',
        isActive: true,
        roles: ['ADMIN'],
      });
      console.log('✅ Admin user created');
    }
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
  }
}

(async function main() {
  try {
    await connectDB();
    await seedData();

    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      },
    });

    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token;
        if (!token) {
          return next(new Error('Unauthorized'));
        }

        const decoded = verifyAccessToken(token);
        const user = await User.findById(decoded.id);
        if (!user) {
          return next(new Error('Unauthorized'));
        }

        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Unauthorized'));
      }
    });

    io.on('connection', (socket) => {
      const userId = socket.user?._id?.toString();
      if (userId) {
        socket.join(`user:${userId}`);
      }

      socket.on('disconnect', () => {});
    });

    app.set('io', io);
    global.io = io;

    server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (error) {
    console.error('Server failed to start:', error.message);
    process.exit(1);
  }
})();
