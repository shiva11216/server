import express from 'express';
import asyncHandler from 'express-async-handler';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Service from '../models/Service.js';
import ServiceRequest from '../models/ServiceRequest.js';
import Project from '../models/Project.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

const router = express.Router();

// @desc    Get all service requests (Admin only)
// @route   GET /api/service-requests
// @access  Private (Admin)
router.get(
  '/',
  protect,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const serviceRequests = await ServiceRequest.find()
      .populate('client', 'name email')
      .populate('service', 'title price')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(new ApiResponse(200, serviceRequests));
  })
);

// @desc    Get my service requests (Client)
// @route   GET /api/service-requests/my-requests
// @access  Private (Client)
router.get(
  '/my-requests',
  protect,
  asyncHandler(async (req, res) => {
    const serviceRequests = await ServiceRequest.find({ client: req.user._id })
      .populate('service', 'title price')
      .populate('approvedBy', 'name')
      .populate('project', 'title status')
      .sort({ createdAt: -1 });

    res.json(new ApiResponse(200, serviceRequests));
  })
);

// @desc    Send a service request
// @route   POST /api/service-requests
// @access  Private (Client)
router.post(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const { serviceId, description } = req.body;

    if (!serviceId || !description) {
      throw new ApiError(400, 'Service ID and description are required');
    }

    // Find the service
    const service = await Service.findById(serviceId);
    if (!service) {
      throw new ApiError(404, 'Service not found');
    }

    // Create the service request
    const serviceRequest = await ServiceRequest.create({
      client: req.user._id,
      service: serviceId,
      description,
      status: 'Pending',
    });

    // Find an admin user to notify
    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      // Create notification message for admin
      await Message.create({
        sender: req.user._id,
        receiver: admin._id,
        message: `New Service Request: ${service.title}\n\nPrice: $${service.price}\n\nDescription: ${description}\n\nPlease check the Service Requests page to approve or reject.`,
        project: null,
      });
    }

    const populatedRequest = await ServiceRequest.findById(serviceRequest._id)
      .populate('service', 'title price');

    res.status(201).json(
      new ApiResponse(
        201,
        populatedRequest,
        'Service request submitted successfully'
      )
    );
  })
);

// @desc    Approve a service request
// @route   PUT /api/service-requests/:id/approve
// @access  Private (Admin)
router.put(
  '/:id/approve',
  protect,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { adminNotes, projectTitle, deadline, assignedEmployees } = req.body;

    const serviceRequest = await ServiceRequest.findById(req.params.id)
      .populate('client')
      .populate('service');

    if (!serviceRequest) {
      throw new ApiError(404, 'Service request not found');
    }

    if (serviceRequest.status !== 'Pending') {
      throw new ApiError(400, 'Service request has already been processed');
    }

    // Create the project
    const project = await Project.create({
      title: projectTitle || `${serviceRequest.service.title} for ${serviceRequest.client.name}`,
      description: serviceRequest.description,
      client: serviceRequest.client._id,
      service: serviceRequest.service._id,
      assignedEmployees: assignedEmployees || [],
      status: 'Pending',
      deadline: deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
    });

    // Update service request
    serviceRequest.status = 'Approved';
    serviceRequest.approvedBy = req.user._id;
    serviceRequest.approvedAt = new Date();
    serviceRequest.adminNotes = adminNotes;
    serviceRequest.project = project._id;
    await serviceRequest.save();

    // Notify client
    await Message.create({
      sender: req.user._id,
      receiver: serviceRequest.client._id,
      message: `Your service request for "${serviceRequest.service.title}" has been approved!\n\nProject: ${project.title}\n${adminNotes ? `\nNotes: ${adminNotes}` : ''}`,
      project: project._id,
    });

    res.json(
      new ApiResponse(
        200,
        { serviceRequest, project },
        'Service request approved and project created'
      )
    );
  })
);

// @desc    Reject a service request
// @route   PUT /api/service-requests/:id/reject
// @access  Private (Admin)
router.put(
  '/:id/reject',
  protect,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { adminNotes } = req.body;

    const serviceRequest = await ServiceRequest.findById(req.params.id)
      .populate('client')
      .populate('service');

    if (!serviceRequest) {
      throw new ApiError(404, 'Service request not found');
    }

    if (serviceRequest.status !== 'Pending') {
      throw new ApiError(400, 'Service request has already been processed');
    }

    // Update service request
    serviceRequest.status = 'Rejected';
    serviceRequest.approvedBy = req.user._id;
    serviceRequest.approvedAt = new Date();
    serviceRequest.adminNotes = adminNotes || 'Request rejected';
    await serviceRequest.save();

    // Notify client
    await Message.create({
      sender: req.user._id,
      receiver: serviceRequest.client._id,
      message: `Your service request for "${serviceRequest.service.title}" has been rejected.\n\nReason: ${adminNotes || 'Not specified'}`,
      project: null,
    });

    res.json(new ApiResponse(200, serviceRequest, 'Service request rejected'));
  })
);

export default router;
