const User = require("../models/User.model");
const Role = require("../models/Role.model");
const bcrypt = require("bcrypt");
const jwtUtil = require("../utils/jwt.util");

const userResponse = (user) => ({
  id: user._id,
  email: user.email,
  fullName: user.fullName,
  avatarUrl: user.avatarUrl || null,
  roles: user.roles || [],
});

const register = async (data) => {
  const { email, password, fullName } = data;

  const exists = await User.findOne({ email });
  if (exists) {
    throw new Error("Email đã tồn tại");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  let userRole = await Role.findOne({ name: "USER" });
  if (!userRole) {
    userRole = await Role.create({
      name: "USER",
      description: "Default user role",
    });
  }

  const user = await User.create({
    email,
    password: hashedPassword,
    fullName,
    isActive: true,
    roles: [userRole.name],
  });

  return {
    accessToken: jwtUtil.generateAccessToken(user),
    refreshToken: jwtUtil.generateRefreshToken(user),
    id: user._id.toString(),
    email: user.email,
    fullName: user.fullName,
  };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("User not found");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  return {
    accessToken: jwtUtil.generateAccessToken(user),
    refreshToken: jwtUtil.generateRefreshToken(user),
    id: user._id.toString(),
    email: user.email,
    fullName: user.fullName,
  };
};

const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  return userResponse(user);
};

const getAllUsers = async () => {
  const users = await User.find();
  return users.map(userResponse);
};

const searchUsers = async (searchTerm) => {
  const safeSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const users = await User.find({
    $or: [
      { fullName: { $regex: safeSearchTerm, $options: "i" } },
      { email: { $regex: safeSearchTerm, $options: "i" } },
    ],
  }).limit(10);

  return users.map((user) => ({
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    avatarUrl: user.avatarUrl,
  }));
};

const assignRole = async ({ userId, roleNames }) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const normalizedRoles = roleNames.map((role) => role.toUpperCase());

  // Validate roles exist in Role collection
  const foundRoles = await Role.find({ name: { $in: normalizedRoles } });
  if (foundRoles.length !== normalizedRoles.length) {
    const foundNames = foundRoles.map((r) => r.name);
    const missing = normalizedRoles.filter((r) => !foundNames.includes(r));
    throw new Error(`Roles not found: ${missing.join(", ")}`);
  }

  const previousRoles = user.roles;
  user.roles = normalizedRoles;
  await user.save();

  return {
    userId: user._id,
    email: user.email,
    fullName: user.fullName,
    previousRoles,
    newRoles: normalizedRoles,
    message: "Successfully assigned roles to user",
  };
};

const updateUser = async (targetUserId, updateData) => {
  const user = await User.findById(targetUserId);
  if (!user) {
    throw new Error("User not found");
  }

  if (updateData.fullName) user.fullName = updateData.fullName;
  if (updateData.avatarUrl) user.avatarUrl = updateData.avatarUrl;

  await user.save();

  return {
    id: user._id,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    roles: user.roles,
    message: "User updated successfully",
  };
};

const deleteUser = async (targetUserId) => {
  const user = await User.findById(targetUserId);
  if (!user) throw new Error("User not found");

  const isAdmin = user.roles.includes("ADMIN");
  if (isAdmin) {
    const adminCount = await User.countDocuments({ roles: "ADMIN" });
    if (adminCount <= 1) {
      throw new Error("Cannot delete the last ADMIN user");
    }
  }

  await user.deleteOne();
};

module.exports = {
  register,
  login,
  getMe,
  getAllUsers,
  searchUsers,
  assignRole,
  updateUser,
  deleteUser,
};
