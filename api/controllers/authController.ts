import { User } from "../models/user";
import { signAccessToken, signRefreshToken } from "../util/jwt";
import { hashPassword, comparePassword } from "../util/password";
// import { AuthenticatedRequest } from "../../util/types";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";

/**
 * Get current authenticated user info
 * Updates lastLogin timestamp and returns user data
 */
export async function getUser(req: Request, res: Response) {
  try {
    const userId = req.user!.sub;
    const user = await User.findOne({ sub: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found", user: null });
    }
    const userPayload = {
      _id: user._id,
      sub: user.sub,
      email: user.email,
      role: user.role,
    };
    res.json({ success: true, message: "User fetched successfully", user: userPayload });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ success: false, message: "Failed to fetch user", user: null });
  }
}

/**
 * Register a new user
 * Validates input, checks for existing email, hashes password, saves user
 */
export async function register(req: Request, res: Response) {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }
  const existing = await User.findOne({ email });
  if (existing) {
    return res
      .status(409)
      .json({ success: false, message: "Email already registered" });
  }
  const hashedPassword = await hashPassword(password);
  const user = new User({
    name,
    email,
    password: hashedPassword,
    role,
    sub: email,
  });
  await user.save();
  const accessToken = signAccessToken({
    _id: user._id,
    sub: user.sub,
    email: user.email,
    role: user.role,
  });
  const refreshToken = signRefreshToken({ sub: user.sub });
  return res
    .status(201)
    .json({
      success: true,
      message: "User registered successfully",
      user: {
        _id: user._id,
        sub: user.sub,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
}

/**
 * Login user
 * Validates credentials, returns JWT access and refresh tokens
 */
export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Email and password required" });
  }
  const user = await User.findOne({ email });
  if (!user) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials" });
  }
  const valid = await comparePassword(password, user.get("password"));
  if (!valid) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials" });
  }
  const accessToken = signAccessToken({
    _id: user._id,
    sub: user.sub,
    email: user.email,
    role: user.role,
  });
  const refreshToken = signRefreshToken({ sub: user.sub });
  return res.json({
    success: true,
    accessToken,
    refreshToken,
    user: { _id: user._id, sub: user.sub, email: user.email, role: user.role },
  });
}

/**
 * Logout user
 * Stateless JWT: just respond OK (client should delete token)
 */
export async function logout(req: Request, res: Response) {
  return res.json({ success: true, message: "Logged out" });
}

/**
 * Change password for authenticated user
 * Validates old password, hashes and sets new password
 */
export async function changePassword(req: Request, res: Response) {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res
      .status(400)
      .json({ success: false, message: "Old and new password required" });
  }
  const userId = req.user?.sub;
  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  const user = await User.findOne({ sub: userId });
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  const valid = await comparePassword(oldPassword, user.get("password"));
  if (!valid) {
    return res
      .status(401)
      .json({ success: false, message: "Old password incorrect" });
  }
  user.set("password", await hashPassword(newPassword));
  await user.save();
  return res.json({ success: true, message: "Password changed successfully" });
}

/**
 * Refresh JWT access token using a valid refresh token
 * Returns new access token if refresh token is valid
 */
export async function refreshToken(req: Request, res: Response) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res
      .status(400)
      .json({ success: false, message: "Refresh token required" });
  }
  try {
    const payload = jwt.verify(
      refreshToken,
      process.env.JWT_SECRET || "your_jwt_secret"
    );
    const user = await User.findOne({ sub: payload.sub });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const accessToken = signAccessToken({
      sub: user.sub,
      email: user.email,
      role: user.role,
    });
    return res.json({ success: true, accessToken });
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid refresh token" });
  }
}
