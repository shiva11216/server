import asyncHandler from 'express-async-handler';
import Project from '../models/Project.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// @desc    Get all projects (Admin only)
// @route   GET /api/projects
// @access  Private/Admin
export const getAllProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({})
    .populate('client', 'name email')
    .populate('service', 'title price')
    .populate('assignedEmployees', 'name email');

  res.json(
    new ApiResponse(200, projects, 'Projects fetched successfully')
  );
});

// @desc    Get my projects (Employee/Client)
// @route   GET /api/projects/my-projects
// @access  Private
export const getMyProjects = asyncHandler(async (req, res) => {
  let projects;

  if (req.user.role === 'client') {
    // Clients see only their projects
    projects = await Project.find({ client: req.user._id })
      .populate('service', 'title price')
      .populate('assignedEmployees', 'name email');
  } else if (req.user.role === 'employee') {
    // Employees see only assigned projects
    projects = await Project.find({ assignedEmployees: req.user._id })
      .populate('client', 'name email')
      .populate('service', 'title price')
      .populate('assignedEmployees', 'name email');
  } else {
    throw new ApiError(403, 'Not authorized');
  }

  res.json(
    new ApiResponse(200, projects, 'Projects fetched successfully')
  );
});

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
export const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('client', 'name email')
    .populate('service', 'title description price')
    .populate('assignedEmployees', 'name email');

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  // Check authorization
  if (req.user.role === 'client' && project.client._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized to access this project');
  }

  if (req.user.role === 'employee' && !project.assignedEmployees.some(emp => emp._id.toString() === req.user._id.toString())) {
    throw new ApiError(403, 'Not authorized to access this project');
  }

  res.json(
    new ApiResponse(200, project, 'Project fetched successfully')
  );
});

// @desc    Create new project
// @route   POST /api/projects
// @access  Private/Admin
export const createProject = asyncHandler(async (req, res) => {
  const { title, description, client, service, budget, assignedEmployees, deadline } = req.body;

  if (!title || !client || !service || !budget || !deadline) {
    throw new ApiError(400, 'Please provide all required fields');
  }

  const project = await Project.create({
    title,
    description,
    client,
    service,
    budget,
    assignedEmployees: assignedEmployees || [],
    deadline,
  });

  const populatedProject = await Project.findById(project._id)
    .populate('client', 'name email')
    .populate('service', 'title price')
    .populate('assignedEmployees', 'name email');

  res.status(201).json(
    new ApiResponse(201, populatedProject, 'Project created successfully')
  );
});

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private/Admin
export const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  const { title, description, client, service, budget, assignedEmployees, status, deadline } = req.body;

  project.title = title || project.title;
  project.description = description !== undefined ? description : project.description;
  project.client = client || project.client;
  project.service = service || project.service;
  project.budget = budget || project.budget;
  project.assignedEmployees = assignedEmployees || project.assignedEmployees;
  project.status = status || project.status;
  project.deadline = deadline || project.deadline;

  const updatedProject = await project.save();
  await updatedProject.populate('client', 'name email');
  await updatedProject.populate('service', 'title price');
  await updatedProject.populate('assignedEmployees', 'name email');

  res.json(
    new ApiResponse(200, updatedProject, 'Project updated successfully')
  );
});

// @desc    Update project status (Employee only)
// @route   PATCH /api/projects/:id/status
// @access  Private/Employee
export const updateProjectStatus = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  // Check if employee is assigned to this project
  if (!project.assignedEmployees.some(emp => emp.toString() === req.user._id.toString())) {
    throw new ApiError(403, 'Not authorized to update this project');
  }

  const { status } = req.body;

  if (!status || !['Pending', 'In Progress', 'Testing', 'Completed'].includes(status)) {
    throw new ApiError(400, 'Please provide a valid status');
  }

  project.status = status;
  const updatedProject = await project.save();
  await updatedProject.populate('client', 'name email');
  await updatedProject.populate('service', 'title price');
  await updatedProject.populate('assignedEmployees', 'name email');

  res.json(
    new ApiResponse(200, updatedProject, 'Project status updated successfully')
  );
});

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private/Admin
export const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  await project.deleteOne();
  res.json(
    new ApiResponse(200, null, 'Project deleted successfully')
  );
});
