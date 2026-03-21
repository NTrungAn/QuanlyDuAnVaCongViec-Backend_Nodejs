const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // MongoDB tự tạo _id là ObjectId, không cần định nghĩa UUID thủ công
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Thay vì tạo file Role riêng, ta dùng mảng String (Enum) 
    // cho đúng chất Node.js nhanh gọn
    roles: [
      {
        type: String,
        enum: ["ADMIN", "USER", "MANAGER"],
        default: ["USER"],
      },
    ],
  },
  {
    // Tương đương BaseEntity: tự động thêm createdAt và updatedAt
    timestamps: true,
    versionKey: false, // Bỏ trường __v mặc định của mongoose
  }
);

// Tương đương findByEmail
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email });
};

// Tương đương countByRolesContaining
userSchema.statics.countByRoleName = async function(roleName) {
  // Vì role trong MongoDB (cách đơn giản) là mảng String hoặc ObjectId
  return this.countDocuments({ roles: roleName }); 
};

module.exports = mongoose.model('User', userSchema);
