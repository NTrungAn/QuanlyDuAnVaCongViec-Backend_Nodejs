const mongoose = require('mongoose');
const Task = require('./src/models/Task.model');
const Epic = require('./src/models/Epic.model');
const taskService = require('./src/services/task.service');

async function test() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/quanlycongviec');
    
    // Find an existing project to use
    const Project = require('./src/models/Project.model');
    const project = await Project.findOne();
    if (!project) return console.log("No project found");

    // 1. Create Epic
    const epic = await Epic.create({
      name: "Test Epic",
      project: project._id,
      createdBy: project.members[0] || new mongoose.Types.ObjectId()
    });
    console.log("Epic created:", epic._id);

    // 2. Create Task with Epic
    const task = await taskService.createTask({
      title: "Test Task in Epic",
      project: project._id,
      epic: epic._id.toString()
    }, project.members[0] || new mongoose.Types.ObjectId());
    console.log("Task created with Epic:", task.id);

    // 3. Verify Epic tasks length
    const updatedEpic = await Epic.findById(epic._id);
    console.log("Epic tasks array length:", updatedEpic.tasks.length);

    process.exit(0);
  } catch (err) {
    console.error("ERROR CAUGHT:", err);
    process.exit(1);
  }
}
test();
