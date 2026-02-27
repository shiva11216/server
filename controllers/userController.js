import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password');
  res.json(
    new ApiResponse(200, users, 'Users fetched successfully')
  );
});

// @desc    Get users by role
// @route   GET /api/users/role/:role
// @access  Private/Admin
export const getUsersByRole = asyncHandler(async (req, res) => {
  const { role } = req.params;

  if (!['admin', 'employee', 'client'].includes(role)) {
    throw new ApiError(400, 'Invalid role');
  }

  const users = await User.find({ role }).select('-password');
  res.json(
    new ApiResponse(200, users, `${role}s fetched successfully`)
  );
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.json(
    new ApiResponse(200, user, 'User fetched successfully')
  );
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Only admin can update other users, users can update themselves
  if (req.user.role !== 'admin' && req.user._id.toString() !== user._id.toString()) {
    throw new ApiError(403, 'Not authorized to update this user');
  }

  const { name, email, role, password } = req.body;

  user.name = name || user.name;
  user.email = email || user.email;

  // Update password if provided
  if (password) {
    user.password = password;
  }

  // Only admin can change roles
  if (role && req.user.role === 'admin') {
    user.role = role;
  }

  const updatedUser = await user.save();

  res.json(
    new ApiResponse(
      200,
      {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
      'User updated successfully'
    )
  );
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  await user.deleteOne();
  res.json(
    new ApiResponse(200, null, 'User deleted successfully')
  );
});

// @desc    Update own profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const { name, email, password } = req.body;

  user.name = name || user.name;
  user.email = email || user.email;

  if (password) {
    user.password = password;
  }

  const updatedUser = await user.save();

  res.json(
    new ApiResponse(
      200,
      {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
      'Profile updated successfully'
    )
  );
});
