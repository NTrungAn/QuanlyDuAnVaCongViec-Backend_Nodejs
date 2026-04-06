const mongoose = require("mongoose");

const taskStatusSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["TODO", "IN_PROGRESS", "DONE"],
      default: "TODO",
    },
    color: {
      type: String,
      default: "#F4F5F7",
    },
    order: {
      type: Number,
      default: 0,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Đảm bảo tên trạng thái là duy nhất trong một dự án
taskStatusSchema.index({ project: 1, name: 1 }, { unique: true });

module.exports =
  mongoose.models.TaskStatus || mongoose.model("TaskStatus", taskStatusSchema);
