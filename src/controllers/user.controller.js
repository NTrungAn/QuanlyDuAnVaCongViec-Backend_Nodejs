const userService = require("../services/user.service");

const register = async (req, res) => {
  try {
    const auth = await userService.register(req.body);
    return res.status(201).json(auth);
  } catch (error) {
    return res
      .status(400)
      .json({ message: error.message || "Register failed" });
  }
};

const login = async (req, res) => {
  try {
    const auth = await userService.login(req.body);
    return res.status(200).json(auth);
  } catch (error) {
    return res.status(400).json({ message: error.message || "Login failed" });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await userService.getMe(req.user._id);
    return res.status(200).json(user);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(200).json([]);
    const users = await userService.searchUsers(q);
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const assignRole = async (req, res) => {
  try {
    const result = await userService.assignRole(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id.toString();
    const isAdmin = req.user.roles.includes("ADMIN");
    if (!isAdmin && currentUserId !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const result = await userService.updateUser(userId, req.body);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id.toString();
    const isAdmin = req.user.roles.includes("ADMIN");
    if (!isAdmin && currentUserId !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "File is required" });
    }

    const avatarUrl = `/api/users/avatars/${req.file.filename}`;
    const result = await userService.updateUser(userId, { avatarUrl });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await userService.deleteUser(userId);
    return res.status(204).send();
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  getMe,
  getAllUsers,
  searchUsers,
  assignRole,
  updateUser,
  uploadAvatar,
  deleteUser,
};
