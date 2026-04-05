const mongoose = require('mongoose');

const epicSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['PLANNING', 'IN_PROGRESS', 'DONE'],
      default: 'PLANNING',
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual populate cho các Task thuộc Epic này
epicSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'epic',
});

module.exports = mongoose.models.Epic || mongoose.model('Epic', epicSchema);
