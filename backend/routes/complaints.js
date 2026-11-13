const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const Complaint = require('../models/Complaint');
const { protect, adminOnly } = require('../middleware/auth');
const rateLimit = require('../middleware/rateLimit');
const { uploadImage, ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } = require('../services/cloudinary');

const router = express.Router();
const trackingRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Too many tracking requests. Please try again in a minute.',
});
const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many image uploads. Please try again later.',
});
const submissionRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Too many complaints submitted. Please try again later.',
});
const feedbackRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many feedback submissions. Please try again later.',
});

// Helper to find complaint by ID or complaintId (case-insensitive)
function buildIdQuery(rawId) {
  if (!rawId) return { _id: null };
  const strId = String(rawId).trim();
  const queries = [
    { complaintId: strId },
    { complaintId: strId.toUpperCase() },
  ];
  if (mongoose.isValidObjectId(strId)) {
    queries.push({ _id: strId });
  }
  return { $or: queries };
}

function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function displaySeverity(complaint) {
  const valid = new Set(['critical', 'high', 'medium', 'low']);
  const value = [complaint.aiSeverity, complaint.severity, complaint.priority]
    .map((candidate) => String(candidate || '').trim().toLowerCase())
    .find((candidate) => valid.has(candidate));
  return value ? `${value[0].toUpperCase()}${value.slice(1)}` : '';
}

function normalizeMedia(media) {
  if (media === undefined) return [];
  if (!Array.isArray(media) || media.length > 5) {
    const error = new Error('Attach no more than 5 images');
    error.status = 400;
    throw error;
  }

  return media.map((item) => {
    if (!item || typeof item !== 'object') {
      const error = new Error('Invalid image attachment');
      error.status = 400;
      throw error;
    }
    let url;
    try {
      url = new URL(item.url);
    } catch {
      url = null;
    }
    if (
      !url
      || url.protocol !== 'https:'
      || url.hostname !== 'res.cloudinary.com'
      || !ALLOWED_IMAGE_TYPES.has(item.type)
      || typeof item.name !== 'string'
    ) {
      const error = new Error('Image attachments must use the configured Cloudinary storage');
      error.status = 400;
      throw error;
    }
    return {
      name: cleanText(item.name, 180) || 'complaint-image',
      size: cleanText(String(item.size || ''), 24),
      type: item.type,
      url: url.toString(),
      publicId: typeof item.publicId === 'string' ? cleanText(item.publicId, 240) : '',
    };
  });
}

function ownershipError(req, complaint) {
  if (req.user.role === 'admin') return false;
  const ownerId = complaint.submittedBy || complaint.reportedBy;
  return String(ownerId || '') !== String(req.user._id);
}

function toApiComplaint(complaint) {
  const obj = typeof complaint.toObject === 'function' ? complaint.toObject() : { ...complaint };
  const storedLocation = obj.location && typeof obj.location === 'object' ? obj.location : {};
  const address = typeof obj.location === 'string' ? obj.location : (storedLocation.address || '');
  obj.locationDetails = storedLocation;
  obj.location = address;
  obj.ward = obj.ward || storedLocation.ward || '';
  obj.severity = displaySeverity(obj);
  obj.pincode = obj.pincode || storedLocation.pincode || '';
  obj.lat = obj.lat ?? storedLocation.lat;
  obj.lng = obj.lng ?? storedLocation.lng;
  obj.reportedBy = obj.reportedBy || obj.submittedBy;
  obj.media = obj.media || (obj.photos || []).map((photo) => ({
    url: photo.url,
    publicId: photo.publicId,
    name: 'Complaint photo',
  }));
  if (!Array.isArray(obj.images) || obj.images.length === 0) {
    obj.images = (obj.photos || []).map((photo) => photo.url).filter(Boolean);
  }
  obj.timeline = (obj.timeline || []).map((entry) => ({
    ...entry,
    action: entry.action || (typeof entry.note === 'string' && entry.note.includes(': ')
      ? entry.note.slice(0, entry.note.indexOf(': '))
      : (entry.note || entry.status || 'Complaint updated')),
    actor: entry.actor || '',
    note: entry.note || '',
  }));
  if (!Array.isArray(obj.history) || obj.history.length === 0) obj.history = obj.timeline;
  obj.dateSubmitted = obj.dateSubmitted || obj.createdAt?.toISOString?.().slice(0, 10) || '';
  obj.lastUpdated = obj.lastUpdated || obj.updatedAt?.toISOString?.().slice(0, 10) || obj.dateSubmitted;
  obj.id = obj.complaintId || obj._id;
  return obj;
}

// POST /api/complaints/upload - Upload one image through the shared backend.
router.post('/upload', uploadRateLimit, protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'citizen') {
      return res.status(403).json({
        message: 'Only citizens can upload complaint images',
        code: 'UPLOAD_ROLE_FORBIDDEN',
        requestId: req.requestId || null,
      });
    }
    const { dataUrl, filename } = req.body;
    const match = typeof dataUrl === 'string'
      ? dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/)
      : null;
    if (!match) {
      console.warn('Complaint image upload rejected before storage', {
        event: 'complaint_image_upload_invalid_payload',
        requestId: req.requestId || null,
        hasDataUrl: typeof dataUrl === 'string',
        contentType: req.get('content-type') || '',
      });
      return res.status(400).json({
        message: 'Upload a valid JPG, PNG, or WebP image',
        code: 'INVALID_IMAGE',
        requestId: req.requestId || null,
      });
    }

    const contentType = match[1];
    const buffer = Buffer.from(match[2], 'base64');
    console.info('Complaint image upload received', {
      event: 'complaint_image_upload_received',
      requestId: req.requestId || null,
      role: req.user.role,
      contentType,
      bytes: buffer.length,
    });
    if (buffer.length > MAX_IMAGE_BYTES) {
      return res.status(400).json({
        message: 'Each image must be 5 MB or smaller',
        code: 'IMAGE_TOO_LARGE',
        requestId: req.requestId || null,
      });
    }
    const safeFilename = cleanText(String(filename || '').split(/[\\/]/).pop(), 180) || 'complaint-image';
    const media = await uploadImage({ buffer, contentType, filename: safeFilename, requestId: req.requestId });
    return res.status(201).json({ media, requestId: req.requestId || null });
  } catch (error) {
    if (error.status) {
      console.warn('Complaint image upload failed', {
        event: 'complaint_image_upload_failed',
        requestId: req.requestId || null,
        status: error.status,
        code: error.code || 'IMAGE_UPLOAD_FAILED',
      });
      return res.status(error.status).json({
        message: error.message,
        code: error.code || 'IMAGE_UPLOAD_FAILED',
        requestId: req.requestId || null,
      });
    }
    return next(error);
  }
});

// ─── CITIZEN ENDPOINTS ──────────────────────────────────────

// POST /api/complaints - Submit a new complaint (citizen)
router.post('/', submissionRateLimit, protect, async (req, res) => {
  try {
    if (req.user.role !== 'citizen') {
      return res.status(403).json({ message: 'Only citizens can submit complaints' });
    }
    const { title, description, category, location, ward, pincode, lat, lng } = req.body;
    const cleanTitle = cleanText(title, 120);
    const cleanDescription = cleanText(description, 5000);
    const cleanCategory = cleanText(category, 80);

    if (!cleanTitle || !cleanDescription || !cleanCategory) {
      return res.status(400).json({ message: 'Title, description, and category are required' });
    }
    if (cleanDescription.length < 20) {
      return res.status(400).json({ message: 'Description must be at least 20 characters' });
    }
    const media = normalizeMedia(req.body.media);
    let coordinates;
    if (lat !== undefined || lng !== undefined) {
      const parsedLat = Number(lat);
      const parsedLng = Number(lng);
      if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng) || parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
        return res.status(400).json({ message: 'Latitude and longitude must be valid coordinates' });
      }
      coordinates = { lat: parsedLat, lng: parsedLng };
    }

    const today = new Date().toISOString().slice(0, 10);
    const complaintId = `GV-${new Date().getFullYear()}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    const incomingLocation = location && typeof location === 'object' ? location : {};
    const address = typeof location === 'string' ? location : incomingLocation.address;
    const nestedLocation = {
      address: cleanText(address, 240),
      ward: cleanText(ward || incomingLocation.ward, 120),
      pincode: cleanText(pincode || incomingLocation.pincode, 12),
      ...(coordinates || (incomingLocation.lat != null && incomingLocation.lng != null
        ? { lat: Number(incomingLocation.lat), lng: Number(incomingLocation.lng) }
        : {})),
    };
    const complaint = await Complaint.create({
      complaintId,
      title: cleanTitle,
      description: cleanDescription,
      category: cleanCategory,
      location: nestedLocation,
      status: 'submitted',
      priority: 'medium',
      severity: 'Medium',
      submittedBy: req.user._id,
      department: getDepartment(cleanCategory),
      photos: media.map((item) => ({ url: item.url, publicId: item.publicId })),
      timeline: [
        {
          date: today,
          status: 'submitted',
          note: 'Submitted via citizen portal',
        },
      ],
    });

    const complaintObj = toApiComplaint(complaint);

    res.status(201).json({
      message: 'Complaint submitted successfully',
      complaint: complaintObj,
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    if (error.code === 11000) return res.status(409).json({ message: 'Please retry complaint submission' });
    if (error.name === 'ValidationError') return res.status(400).json({ message: 'Please check the complaint details' });
    console.error('Create complaint error:', error);
    res.status(500).json({ message: 'Server error creating complaint' });
  }
});

// GET /api/complaints/my - Get complaints for logged-in citizen
router.get('/my', protect, async (req, res) => {
  try {
    const complaints = await Complaint.find({ $or: [
      { submittedBy: req.user._id },
      { reportedBy: req.user._id },
    ] })
      .sort({ createdAt: -1 });

    const formatted = complaints.map(toApiComplaint);

    res.json({ complaints: formatted });
  } catch (error) {
    console.error('Get my complaints error:', error);
    res.status(500).json({ message: 'Server error fetching complaints' });
  }
});

// GET /api/complaints/track/:complaintId - Track a complaint by ID (public)
router.get('/track/:complaintId', trackingRateLimit, async (req, res) => {
  try {
    const complaint = await Complaint.findOne(buildIdQuery(req.params.complaintId));
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const obj = toApiComplaint(complaint);

    res.json({
      complaint: {
        id: obj.id,
        complaintId: obj.complaintId,
        title: obj.title,
        description: obj.description,
        category: obj.category,
        status: obj.status,
        priority: obj.priority,
        severity: obj.severity,
        ward: obj.ward,
        location: obj.location,
        locationDetails: obj.locationDetails,
        department: obj.department,
        dateSubmitted: obj.dateSubmitted,
        lastUpdated: obj.lastUpdated,
        departmentUpdate: obj.departmentUpdate,
        aiSeverity: obj.aiSeverity,
        aiCategory: obj.aiCategory,
        media: obj.media,
        photos: obj.photos || [],
        timeline: obj.timeline,
      },
    });
  } catch (error) {
    console.error('Track complaint error:', error);
    res.status(500).json({ message: 'Server error tracking complaint' });
  }
});

// GET /api/complaints/detail/:complaintId - Get complaint detail
router.get('/detail/:complaintId', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findOne(buildIdQuery(req.params.complaintId));
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    if (ownershipError(req, complaint)) {
      return res.status(403).json({ message: 'You can only view your own complaint details' });
    }
    const obj = toApiComplaint(complaint);
    res.json({ complaint: obj });
  } catch (error) {
    console.error('Get complaint error:', error);
    res.status(500).json({ message: 'Server error fetching complaint' });
  }
});

// POST /api/complaints/:complaintId/feedback - Citizen feedback
router.post('/:complaintId/feedback', feedbackRateLimit, protect, async (req, res) => {
  try {
    const { feedback } = req.body;
    if (req.user.role !== 'citizen') return res.status(403).json({ message: 'Only citizens can submit feedback' });
    const cleanFeedback = cleanText(feedback, 2000);
    if (!cleanFeedback) return res.status(400).json({ message: 'Feedback is required' });
    const complaint = await Complaint.findOne(buildIdQuery(req.params.complaintId));
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    if (ownershipError(req, complaint)) {
      return res.status(403).json({ message: 'You can only provide feedback on your own complaint' });
    }
    if (!['resolved', 'Resolved', 'closed'].includes(complaint.status)) {
      return res.status(409).json({ message: 'Feedback is available after the complaint is resolved' });
    }
    complaint.set('citizenFeedback', cleanFeedback);
    await complaint.save();

    const obj = toApiComplaint(complaint);

    res.json({ message: 'Feedback submitted', complaint: obj });
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ message: 'Server error submitting feedback' });
  }
});

// ─── ADMIN ENDPOINTS ────────────────────────────────────────

// GET /api/complaints/admin/all - Get ALL complaints (admin)
router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    const formatted = complaints.map(toApiComplaint);
    res.json({ complaints: formatted });
  } catch (error) {
    console.error('Admin get complaints error:', error);
    res.status(500).json({ message: 'Server error fetching complaints' });
  }
});

// PUT /api/complaints/admin/:complaintId - Update complaint (admin)
router.put('/admin/:complaintId', protect, adminOnly, async (req, res) => {
  try {
    const complaint = await Complaint.findOne(buildIdQuery(req.params.complaintId));
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ message: 'Provide complaint fields to update' });
    }
    const updates = req.body;
    const validationMessage = validateAdminUpdates(updates);
    if (validationMessage) return res.status(400).json({ message: validationMessage });
    const today = new Date().toISOString().slice(0, 10);
    const oldStatus = complaint.status;

    // Apply updates
    const allowedFields = [
      'status', 'priority', 'severity', 'department', 'assignedTeam',
      'zone', 'departmentUpdate', 'aiSeverity', 'aiCategory',
      'aiConfidence', 'aiExplanation', 'civicImpactScore', 'civicRiskScore',
      'riskFactors', 'clusterId', 'duplicateOf',
    ];

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        complaint.set(field, updates[field]);
      }
    });

    // If status changed, record in timeline
    if (updates.status && updates.status !== oldStatus) {
      if (!Array.isArray(complaint.timeline)) complaint.timeline = [];
      complaint.timeline.push({
        date: today,
        status: updates.status,
        note: updates.departmentUpdate || `Status changed to ${updates.status}`,
        action: 'Status Updated',
        actor: req.user.name,
        previousValue: oldStatus || '',
      });
    }

    await complaint.save();

    const obj = toApiComplaint(complaint);

    res.json({ message: 'Complaint updated', complaint: obj });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ message: 'One or more complaint fields are invalid' });
    }
    console.error('Admin update complaint error:', error);
    res.status(500).json({ message: 'Server error updating complaint' });
  }
});

// POST /api/complaints/admin/:complaintId/history - Add history entry (admin)
router.post('/admin/:complaintId/history', protect, adminOnly, async (req, res) => {
  try {
    const complaint = await Complaint.findOne(buildIdQuery(req.params.complaintId));
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const { action, note } = req.body || {};
    const cleanAction = cleanText(action, 160);
    const cleanNote = cleanText(note, 1000);
    if (!cleanAction || (note !== undefined && typeof note !== 'string')) {
      return res.status(400).json({ message: 'Provide a valid history action and note' });
    }
    const today = new Date().toISOString().slice(0, 10);
    const entry = {
      date: today,
      status: complaint.status,
      note: cleanNote ? `${cleanAction}: ${cleanNote}` : cleanAction,
      action: cleanAction,
      actor: req.user.name,
    };
    if (!Array.isArray(complaint.timeline)) complaint.timeline = [];
    complaint.timeline.push(entry);
    await complaint.save();

    const obj = toApiComplaint(complaint);

    res.json({ message: 'History entry added', complaint: obj });
  } catch (error) {
    console.error('Add history error:', error);
    res.status(500).json({ message: 'Server error adding history' });
  }
});

// Work orders are embedded in their complaint to keep the relationship
// atomic and avoid creating a parallel complaint/work-order database.
router.get('/admin/work-orders', protect, adminOnly, async (req, res) => {
  try {
    const complaints = await Complaint.find({});
    const workOrders = complaints
      .filter((complaint) => complaint.workOrder && complaint.workOrder.id)
      .map((complaint) => ({
        ...(complaint.workOrder.toObject?.() || complaint.workOrder),
        complaintId: complaint.complaintId || String(complaint._id),
        complaintTitle: complaint.title,
        location: complaint.location?.address || '',
      }));
    return res.json({ workOrders });
  } catch (error) {
    console.error('Admin work order list error:', error.message);
    return res.status(500).json({ message: 'Server error fetching work orders' });
  }
});

router.post('/admin/:complaintId/work-order', protect, adminOnly, async (req, res) => {
  try {
    const complaint = await Complaint.findOne(buildIdQuery(req.params.complaintId));
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    if (complaint.workOrder?.id) return res.status(409).json({ message: 'A work order already exists for this complaint' });

    const body = req.body || {};
    const assignedTeam = cleanText(body.assignedTeam, 120);
    const status = assignedTeam ? 'Assigned' : 'Awaiting Assignment';
    const dateFields = ['plannedStartDate', 'estimatedCompletionDate'];
    const dates = {};
    for (const field of dateFields) {
      if (body[field] !== undefined && (!/^\d{4}-\d{2}-\d{2}$/.test(body[field]) || Number.isNaN(Date.parse(`${body[field]}T00:00:00Z`)))) {
        return res.status(400).json({ message: `${field} must be a valid date` });
      }
      if (body[field]) dates[field] = body[field];
    }
    const materials = body.materials === undefined ? [] : body.materials;
    if (!Array.isArray(materials) || materials.length > 50 || materials.some((item) => typeof item !== 'string' || item.trim().length > 120)) {
      return res.status(400).json({ message: 'Materials must be a list of short text values' });
    }
    if (typeof body.notes !== 'undefined' && (typeof body.notes !== 'string' || body.notes.length > 2000)) {
      return res.status(400).json({ message: 'Notes must be text no longer than 2000 characters' });
    }

    const today = new Date().toISOString().slice(0, 10);
    const workOrder = {
      id: `WO-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      complaintId: complaint.complaintId || String(complaint._id),
      title: cleanText(body.title, 160) || complaint.title,
      location: complaint.location?.address || '',
      priority: cleanText(body.priority, 24) || complaint.priority || 'medium',
      assignedTeam: assignedTeam || null,
      assignmentDate: assignedTeam ? today : null,
      ...dates,
      actualCompletionDate: null,
      status,
      materials: materials.map((item) => item.trim()).filter(Boolean),
      notes: cleanText(body.notes, 2000),
      inspectionFindings: '',
      timeline: [{ date: today, status, action: 'Work Order Created', actor: req.user.name, note: 'Work order created from the administrator dashboard.' }],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    complaint.workOrder = workOrder;
    if (assignedTeam) {
      complaint.assignedTeam = assignedTeam;
      complaint.status = 'Assigned';
    }
    if (!Array.isArray(complaint.timeline)) complaint.timeline = [];
    complaint.timeline.push({ date: today, status: complaint.status, action: 'Work Order Created', actor: req.user.name, note: `Work order ${workOrder.id} created.` });
    await complaint.save();
    return res.status(201).json({ workOrder: { ...workOrder, complaintTitle: complaint.title } });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') return res.status(400).json({ message: 'One or more work order fields are invalid' });
    console.error('Create work order error:', error.message);
    return res.status(500).json({ message: 'Server error creating work order' });
  }
});

router.put('/admin/work-orders/:workOrderId', protect, adminOnly, async (req, res) => {
  try {
    const complaints = await Complaint.find({});
    const complaint = complaints.find((item) => item.workOrder?.id === req.params.workOrderId);
    if (!complaint) return res.status(404).json({ message: 'Work order not found' });
    const body = req.body || {};
    const workOrder = complaint.workOrder;
    const oldStatus = workOrder.status;
    const allowedStatuses = new Set(['Awaiting Assignment', 'Assigned', 'Inspection Scheduled', 'Inspection Completed', 'Repair In Progress', 'Awaiting Verification', 'Completed']);
    if (body.status !== undefined && !allowedStatuses.has(body.status)) return res.status(400).json({ message: 'Work order status is invalid' });
    for (const field of ['notes', 'inspectionFindings', 'assignedTeam']) {
      if (body[field] !== undefined && (typeof body[field] !== 'string' || body[field].length > (field === 'notes' ? 2000 : 500))) {
        return res.status(400).json({ message: `${field} must be valid text` });
      }
    }
    if (body.materials !== undefined && (!Array.isArray(body.materials) || body.materials.length > 50 || body.materials.some((item) => typeof item !== 'string' || item.trim().length > 120))) {
      return res.status(400).json({ message: 'Materials must be a list of short text values' });
    }
    const allowedFields = ['status', 'notes', 'inspectionFindings', 'assignedTeam', 'materials', 'plannedStartDate', 'estimatedCompletionDate', 'actualCompletionDate'];
    for (const field of allowedFields) {
      if (body[field] !== undefined) workOrder[field] = Array.isArray(body[field]) ? body[field].map((item) => item.trim()) : body[field];
    }
    const today = new Date().toISOString().slice(0, 10);
    if (body.status && body.status !== oldStatus) {
      workOrder.timeline = Array.isArray(workOrder.timeline) ? workOrder.timeline : [];
      workOrder.timeline.push({ date: today, status: body.status, action: 'Work Order Status Updated', actor: req.user.name, note: `Work order status changed from ${oldStatus} to ${body.status}.` });
      if (['Completed', 'Awaiting Verification'].includes(body.status)) {
        workOrder.actualCompletionDate = body.actualCompletionDate || today;
        if (!['resolved', 'closed'].includes(String(complaint.status || '').toLowerCase())) {
          complaint.status = 'Pending Resolution Verification';
          if (!Array.isArray(complaint.timeline)) complaint.timeline = [];
          complaint.timeline.push({ date: today, status: complaint.status, action: 'Repair Completed', actor: req.user.name, note: `Work order ${workOrder.id} completed; awaiting administrator resolution verification.` });
        }
      } else if (body.status === 'Repair In Progress') {
        complaint.status = 'Repair In Progress';
        if (!Array.isArray(complaint.timeline)) complaint.timeline = [];
        complaint.timeline.push({ date: today, status: complaint.status, action: 'Repair Started', actor: req.user.name, note: `Work order ${workOrder.id} moved to repair in progress.` });
      }
    }
    workOrder.updatedAt = new Date();
    await complaint.save();
    return res.json({ workOrder: { ...(workOrder.toObject?.() || workOrder), complaintId: complaint.complaintId, complaintTitle: complaint.title, location: complaint.location?.address || '' }, complaint: toApiComplaint(complaint) });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') return res.status(400).json({ message: 'One or more work order fields are invalid' });
    console.error('Update work order error:', error.message);
    return res.status(500).json({ message: 'Server error updating work order' });
  }
});

// ─── HELPER ─────────────────────────────────────────────────
function getDepartment(category) {
  const deptMap = {
    'water-supply': 'Water Supply Department',
    'roads-transport': 'Public Works Department',
    'electricity': 'Electrical Department',
    'waste-management': 'Sanitation Department',
    'healthcare': 'Health Department',
    'environment': 'Environment Department',
    'traffic': 'Traffic Department',
    'public-safety': 'Public Safety Department',
    'other': 'General Administration',
    'Pothole': 'Public Works Department',
    'Road Surface Damage': 'Public Works Department',
    'Road Crack': 'Public Works Department',
    'Broken Manhole': 'Infrastructure Department',
    'Waterlogging': 'Drainage Department',
    'Damaged Speed Breaker': 'Public Works Department',
    'Road Collapse': 'Public Works Department',
    'Other Road Infrastructure': 'Public Works Department',
  };
  return deptMap[category] || 'General Administration';
}

function validateAdminUpdates(updates) {
  const statuses = new Set([
    'submitted', 'ai-analyzed', 'assigned', 'in-progress', 'resolved', 'closed',
    'New', 'AI Analysis', 'Pending Verification', 'Verified', 'Assigned',
    'Inspection Scheduled', 'Repair In Progress', 'Pending Resolution Verification',
    'Resolved', 'Rejected',
  ]);
  const priorities = new Set(['low', 'medium', 'high', 'critical', 'Low', 'Medium', 'High', 'Critical']);
  const stringLimits = {
    severity: 40,
    department: 120,
    assignedTeam: 120,
    zone: 120,
    departmentUpdate: 1000,
    aiSeverity: 40,
    aiCategory: 80,
  };

  if (updates.status !== undefined && !statuses.has(updates.status)) {
    return 'Status is invalid';
  }
  if (updates.priority !== undefined && !priorities.has(updates.priority)) {
    return 'Priority is invalid';
  }
  for (const [field, limit] of Object.entries(stringLimits)) {
    if (updates[field] !== undefined && (typeof updates[field] !== 'string' || updates[field].trim().length > limit)) {
      return `${field} must be text no longer than ${limit} characters`;
    }
  }
  for (const field of ['aiConfidence', 'civicImpactScore', 'civicRiskScore']) {
    if (updates[field] !== undefined && (!Number.isFinite(updates[field]) || updates[field] < 0 || updates[field] > 100)) {
      return `${field} must be a number from 0 to 100`;
    }
  }
  if (updates.riskFactors !== undefined && (
    !Array.isArray(updates.riskFactors)
    || updates.riskFactors.length > 20
    || updates.riskFactors.some((factor) => typeof factor !== 'string' || factor.trim().length > 120)
  )) {
    return 'riskFactors must contain no more than 20 short text values';
  }
  for (const field of ['clusterId', 'duplicateOf']) {
    if (updates[field] !== undefined && updates[field] !== null && (typeof updates[field] !== 'string' || updates[field].length > 80)) {
      return `${field} must be a short text value or null`;
    }
  }
  return null;
}

module.exports = router;
