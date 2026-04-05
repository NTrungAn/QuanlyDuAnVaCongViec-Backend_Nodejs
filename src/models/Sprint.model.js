const mongoose = require('mongoose');

const sprintSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    goal: {
      type: String,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['PLANNED', 'ACTIVE', 'COMPLETED'],
      default: 'PLANNED',
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

// Virtual populate cho các Task thuộc Sprint này
sprintSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'sprint',
});

module.exports = mongoose.model('Sprint', sprintSchema);
