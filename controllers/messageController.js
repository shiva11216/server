import asyncHandler from 'express-async-handler';
import Message from '../models/Message.js';
import Project from '../models/Project.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// @desc    Get all messages for a project
// @route   GET /api/messages/project/:projectId
// @access  Private
export const getProjectMessages = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  // Verify user has access to this project
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  // Check authorization
  const isClient = req.user.role === 'client' && project.client.toString() === req.user._id.toString();
  const isEmployee = req.user.role === 'employee' && project.assignedEmployees.some(emp => emp.toString() === req.user._id.toString());
  const isAdmin = req.user.role === 'admin';

  if (!isClient && !isEmployee && !isAdmin) {
    throw new ApiError(403, 'Not authorized to access messages for this project');
  }

  const messages = await Message.find({ project: projectId })
    .populate('sender', 'name email role')
    .populate('receiver', 'name email role')
    .sort({ createdAt: 1 });

  res.json(
    new ApiResponse(200, messages, 'Messages fetched successfully')
  );
});

// @desc    Get my messages
// @route   GET /api/messages/my-messages
// @access  Private
export const getMyMessages = asyncHandler(async (req, res) => {
  const messages = await Message.find({
    $or: [{ sender: req.user._id }, { receiver: req.user._id }],
  })
    .populate('sender', 'name email role')
    .populate('receiver', 'name email role')
    .populate('project', 'title')
    .sort({ createdAt: -1 });

  res.json(
    new ApiResponse(200, messages, 'Messages fetched successfully')
  );
});

// @desc    Get messages with a specific user
// @route   GET /api/messages/user/:userId
// @access  Private
export const getUserMessages = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const messages = await Message.find({
    $or: [
      { sender: req.user._id, receiver: userId },
      { sender: userId, receiver: req.user._id },
    ],
  })
    .populate('sender', 'name email role')
    .populate('receiver', 'name email role')
    .populate('project', 'title')
    .sort({ createdAt: 1 });

  res.json(
    new ApiResponse(200, messages, 'Messages fetched successfully')
  );
});

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
export const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, project, message } = req.body;

  if (!receiverId || !message) {
    throw new ApiError(400, 'Please provide receiver and message');
  }

  // If project is provided, verify access
  if (project) {
    const projectData = await Project.findById(project);

    if (!projectData) {
      throw new ApiError(404, 'Project not found');
    }

    // Check authorization for project messages
    const isClient = req.user.role === 'client' && projectData.client.toString() === req.user._id.toString();
    const isEmployee = req.user.role === 'employee' && projectData.assignedEmployees.some(emp => emp.toString() === req.user._id.toString());
    const isAdmin = req.user.role === 'admin';

    if (!isClient && !isEmployee && !isAdmin) {
      throw new ApiError(403, 'Not authorized to send messages for this project');
    }
  }

  const newMessage = await Message.create({
    sender: req.user._id,
    receiver: receiverId,
    project: project || null,
    message,
  });

  const populatedMessage = await Message.findById(newMessage._id)
    .populate('sender', 'name email role')
    .populate('receiver', 'name email role')
    .populate('project', 'title');

  res.status(201).json(
    new ApiResponse(201, populatedMessage, 'Message sent successfully')
  );
});

// @desc    Mark message as read
// @route   PATCH /api/messages/:id/read
// @access  Private
export const markAsRead = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);

  if (!message) {
    throw new ApiError(404, 'Message not found');
  }

  // Only receiver can mark as read
  if (message.receiver.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized to mark this message as read');
  }

  message.read = true;
  await message.save();

  res.json(
    new ApiResponse(200, message, 'Message marked as read')
  );
});

// @desc    Delete a message
// @route   DELETE /api/messages/:id
// @access  Private/Admin or Sender
export const deleteMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);

  if (!message) {
    throw new ApiError(404, 'Message not found');
  }

  // Only admin or sender can delete
  if (req.user.role !== 'admin' && message.sender.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized to delete this message');
  }

  await message.deleteOne();
  res.json(
    new ApiResponse(200, null, 'Message deleted successfully')
  );
});
