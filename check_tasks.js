const mongoose = require('mongoose');
const Task = require('./src/models/Task.model');

async function test() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/quanlycongviec');
    const tasks = await Task.find().sort({ createdAt: -1 }).limit(5);
    console.log("LAST 5 TASKS:");
    tasks.forEach(t => {
      console.log(`- ID: ${t._id}, Title: "${t.title}", Status: ${t.status}, Project: ${t.project}, isDeleted: ${t.isDeleted}, epic: ${t.epic}, sprint: ${t.sprint}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
test();
