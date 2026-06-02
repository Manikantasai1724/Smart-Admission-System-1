/**
 * @fileoverview User controller for Admin user management.
 */

import User from "../models/User.js";

/**
 * GET /api/users
 * Fetch all users (Admin only)
 */
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users
 * Create a new user (Admin only)
 */
export const createUser = async (req, res, next) => {
  try {
    const { name, username, email, password, role, department } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Username already exists" });
    }

    const newUser = await User.create({
      name,
      username,
      email,
      password,
      role,
      department: department || "ALL"
    });

    res.status(201).json({ success: true, user: newUser });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/:id
 * Update an existing user (Admin only)
 */
export const updateUser = async (req, res, next) => {
  try {
    const { name, username, email, password, role, department } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (name) user.name = name;
    if (username) user.username = username;
    if (email !== undefined) user.email = email;
    if (role) user.role = role;
    if (department) user.department = department;
    
    // Only update password if provided
    if (password) {
      user.password = password;
    }

    await user.save();

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/users/:id
 * Delete a user (Admin only)
 */
export const deleteUser = async (req, res, next) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: "You cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
};
