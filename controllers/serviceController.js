import asyncHandler from 'express-async-handler';
import Service from '../models/Service.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// @desc    Get all services
// @route   GET /api/services
// @access  Private
export const getAllServices = asyncHandler(async (req, res) => {
  const services = await Service.find({});
  res.json(
    new ApiResponse(200, services, 'Services fetched successfully')
  );
});

// @desc    Get single service
// @route   GET /api/services/:id
// @access  Private
export const getServiceById = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);

  if (!service) {
    throw new ApiError(404, 'Service not found');
  }

  res.json(
    new ApiResponse(200, service, 'Service fetched successfully')
  );
});

// @desc    Create new service
// @route   POST /api/services
// @access  Private/Admin
export const createService = asyncHandler(async (req, res) => {
  const { title, description, price } = req.body;

  if (!title || !description || price === undefined) {
    throw new ApiError(400, 'Please provide all required fields');
  }

  const service = await Service.create({
    title,
    description,
    price,
  });

  res.status(201).json(
    new ApiResponse(201, service, 'Service created successfully')
  );
});

// @desc    Update service
// @route   PUT /api/services/:id
// @access  Private/Admin
export const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);

  if (!service) {
    throw new ApiError(404, 'Service not found');
  }

  const { title, description, price } = req.body;

  service.title = title || service.title;
  service.description = description || service.description;
  service.price = price !== undefined ? price : service.price;

  const updatedService = await service.save();

  res.json(
    new ApiResponse(200, updatedService, 'Service updated successfully')
  );
});

// @desc    Delete service
// @route   DELETE /api/services/:id
// @access  Private/Admin
export const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);

  if (!service) {
    throw new ApiError(404, 'Service not found');
  }

  await service.deleteOne();
  res.json(
    new ApiResponse(200, null, 'Service deleted successfully')
  );
});
