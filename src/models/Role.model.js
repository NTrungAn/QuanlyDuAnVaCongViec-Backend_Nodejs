const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    // MongoDB tự quản lý _id (ObjectId), thay thế cho UUID
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true, // Thường Role name để hoa như ADMIN, USER
    },
    description: {
      type: String,
      default: "",
    },
    // Thay thế @ManyToMany và @JoinTable
    // Lưu một mảng các ObjectId tham chiếu đến collection 'Permission'
    permissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Permission",
      },
    ],
  },
  {
    timestamps: true, // Tự động thêm createdAt, updatedAt
    versionKey: false,
  }
);

module.exports = mongoose.model("Role", roleSchema);