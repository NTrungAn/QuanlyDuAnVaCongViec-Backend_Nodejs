const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Authorization', 'Content-Type', 'Accept', 'Origin'],
  credentials: true,
}));

app.use(express.json());

// Tạo folder avatars nếu chưa tồn tại
const uploadDir = path.join(__dirname, 'images', 'avatars');
fs.mkdirSync(uploadDir, { recursive: true });

app.use('/api/users', require('./routes/auth.route'));
app.use('/api/users', require('./routes/user.route'));
app.use('/api/projects', require('./routes/project.route'));
app.use('/api/tasks', require('./routes/task.route'));
app.use('/api/comments', require('./routes/comment.route'));
app.use('/api/stats', require('./routes/stat.route'));
app.use('/api/notifications', require('./routes/notification.route'));
app.use('/api/epics', require('./routes/epic.route'));

// Serve avatar files
app.use('/api/users/avatars', express.static(uploadDir));

app.get('/', (req, res) => {
  res.json({ message: 'Project Management Node API is running.' });
});

module.exports = app;