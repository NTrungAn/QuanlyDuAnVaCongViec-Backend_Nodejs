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

const createNotification = async (data) => {
  const notification = await Notification.create(data);
  return notificationResponse(notification);
};

const getUserNotifications = async (userId) => {
  const notifications = await Notification.find({ recipient: userId })
    .populate('sender', 'fullName avatarUrl')
    .sort({ createdAt: -1 })
    .limit(50);
  return notifications.map(notificationResponse);
};

const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOne({ _id: notificationId, recipient: userId });
  if (!notification) {
    throw new Error('Thông báo không tồn tại');
  }
  notification.isRead = true;
  await notification.save();
  return notificationResponse(notification);
};

const markAllAsRead = async (userId) => {
  await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });
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
};
