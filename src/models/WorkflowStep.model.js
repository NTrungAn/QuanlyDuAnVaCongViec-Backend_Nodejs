const mongoose = require("mongoose");

const workflowStepSchema = new mongoose.Schema(
  {
    workflow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workflow",
      required: true,
    },
    fromStatus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaskStatus",
      required: true,
    },
    toStatus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaskStatus",
      required: true,
    },
    requiredPermission: {
      type: String,
      default: "MEMBER", // Quyền tối thiểu để thực hiện bước này (ADMIN hoặc MEMBER)
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Đảm bảo không trùng lặp các bước trong cùng một Workflow
workflowStepSchema.index({ workflow: 1, fromStatus: 1, toStatus: 1 }, { unique: true });

module.exports =
  mongoose.models.WorkflowStep || mongoose.model("WorkflowStep", workflowStepSchema);
