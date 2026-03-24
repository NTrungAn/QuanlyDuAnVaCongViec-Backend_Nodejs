const Notification = require('../models/Notification.model');

const notificationResponse = (notification) => ({
  id: notification._id,
  recipient: notification.recipient,
  sender: notification.sender,
  type: notification.type,
  message: notification.message,
  link: notification.link,
  isRead: notification.isRead,
  createdAt: notification.createdAt,
});

const emitNotification = (recipientId, payload) => {
  try {
    const { getIO } = require('../socket');
    const io = getIO();
    io.to(`user:${recipientId}`).emit('notification:new', payload);
    io.to(`user:${recipientId}`).emit('notification:unread-count');
  } catch (error) {
    // socket is optional during tests/startup
  }
};

const emitUnreadCount = (recipientId) => {
  try {
    const { getIO } = require('../socket');
    const io = getIO();
    io.to(`user:${recipientId}`).emit('notification:unread-count');
  } catch (error) {
    // socket is optional during tests/startup
  }
};

const createNotification = async (data) => {
  const notification = await Notification.create(data);
  const populated = await Notification.findById(notification._id)
    .populate('sender', 'fullName avatarUrl');
  const result = notificationResponse(populated || notification);
  emitNotification(data.recipient, result);
  return result;
};

const getUserNotifications = async (userId) => {
  const notifications = await Notification.find({ recipient: userId })
    .populate('sender', 'fullName avatarUrl')
    .sort({ createdAt: -1 })
    .limit(50);
  return notifications.map(notificationResponse);
};

const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOne({ _id: notificationId, recipient: userId })
    .populate('sender', 'fullName avatarUrl');
  if (!notification) {
    throw new Error('Thông báo không tồn tại');
  }
  notification.isRead = true;
  await notification.save();
  emitUnreadCount(userId);
  return notificationResponse(notification);
};

const markAllAsRead = async (userId) => {
  await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });
  emitUnreadCount(userId);
  return { message: 'Đã đánh dấu tất cả là đã đọc' };
};

const getUnreadCount = async (userId) => {
  const count = await Notification.countDocuments({ recipient: userId, isRead: false });
  return { unreadCount: count };
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  emitUnreadCount,
};
