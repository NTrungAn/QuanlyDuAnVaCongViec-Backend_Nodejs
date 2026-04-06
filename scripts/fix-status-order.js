#!/usr/bin/env node
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

// Load .env from project root if present
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const TaskStatus = require(
  path.join(__dirname, "..", "src", "models", "TaskStatus.model"),
);

(async () => {
  try {
    const uri =
      process.env.MONGO_URI ||
      process.env.DATABASE_URL ||
      "mongodb://localhost:27017/projectdb";
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const projectId = process.argv[2];
    if (!projectId) {
      console.error("Usage: node scripts/fix-status-order.js <PROJECT_ID>");
      process.exit(1);
    }

    const statuses = await TaskStatus.find({ project: projectId }).sort({
      createdAt: 1,
    });
    for (let i = 0; i < statuses.length; i++) {
      statuses[i].order = i;
      await statuses[i].save();
      console.log(
        `Set order ${i} for status ${statuses[i].name} (${statuses[i]._id})`,
      );
    }

    console.log("Migration complete");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
