const jwt = require("jsonwebtoken");
const crypto = require("crypto");

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Biến môi trường ${name} chưa được cấu hình!`);
  }
  return value;
}

const generateAccessToken = (user) => {
  const payload = {
    id: user._id?.toString ? user._id.toString() : user.id,
    email: user.email,
    roles: user.roles || [],
  };
  return jwt.sign(payload, requiredEnv("ACCESS_TOKEN_SECRET"), {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES || "1h",
  });
};

const generateRefreshToken = (user) => {
  const payload = { id: user._id?.toString ? user._id.toString() : user.id };
  return jwt.sign(payload, requiredEnv("REFRESH_TOKEN_SECRET"), {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES || "7d",
    jwtid: crypto.randomUUID(),
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, requiredEnv("ACCESS_TOKEN_SECRET"));
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, requiredEnv("REFRESH_TOKEN_SECRET"));
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};