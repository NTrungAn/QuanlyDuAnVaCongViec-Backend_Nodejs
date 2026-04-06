const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI).then(async () => {
    const User = require('./src/models/User.model');
    const Role = require('./src/models/Role.model');

    let adminRole = await Role.findOne({ name: 'ADMIN' });
    if (!adminRole) {
        adminRole = await Role.create({ name: 'ADMIN', description: 'Administrator root role' });
    }

    const users = await User.find();
    for (const u of users) {
        if (!u.roles.includes('ADMIN')) {
            u.roles.push('ADMIN');
            await u.save();
        }
    }
    console.log("Updated all users to have ADMIN role!");
    process.exit(0);
}).catch(console.error);
