const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/quanlycongviec';
  await mongoose.connect(mongoUri);
};

module.exports = connectDB;
