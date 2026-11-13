const express = require('express');
const Complaint = require('../models/Complaint');
const { protect, adminOnly } = require('../middleware/auth');
const { analyzeComplaints } = require('../services/complaintAnalysis');

const router = express.Router();

// GET /api/stats/overview - Public overview stats for the home page
router.get('/overview', async (req, res) => {
  try {
    const total = await Complaint.countDocuments();
    const resolved = await Complaint.countDocuments({
      status: { $in: ['resolved', 'Resolved'] },
    });
    const inProgress = await Complaint.countDocuments({
      status: { $in: ['in-progress', 'Repair In Progress', 'assigned', 'Assigned'] },
    });

    res.json({
      totalComplaints: total,
      resolvedComplaints: resolved,
      inProgressComplaints: inProgress,
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
});

// Read-only clustering and screening analysis over the shared complaints collection.
router.get('/admin/analysis', protect, adminOnly, async (req, res) => {
  try {
    const complaints = await Complaint.find({});
    return res.json(analyzeComplaints(complaints));
  } catch (error) {
    console.error('Complaint analysis error:', error.message);
    return res.status(500).json({ message: 'Server error analyzing complaints' });
  }
});

router.get('/admin/activity', protect, adminOnly, async (req, res) => {
  try {
    const complaints = await Complaint.find({});
    const activity = [];
    complaints.forEach((complaint) => {
      const complaintId = complaint.complaintId || String(complaint._id);
      (complaint.timeline || []).forEach((rawEntry, index) => {
        const entry = rawEntry.toObject?.() || rawEntry;
        activity.push({
          id: `${complaintId}:timeline:${index}`,
          timestamp: entry.date || complaint.updatedAt || complaint.createdAt,
          actor: entry.actor || 'Not recorded',
          action: entry.action || entry.status || 'Complaint updated',
          relatedId: complaintId,
          previousValue: entry.previousValue || '',
          newValue: entry.status || '',
          notes: entry.note || '',
        });
      });
      (complaint.workOrder?.timeline || []).forEach((rawEntry, index) => {
        const entry = rawEntry.toObject?.() || rawEntry;
        activity.push({
          id: `${complaintId}:work-order:${index}`,
          timestamp: entry.date || complaint.workOrder.updatedAt || complaint.updatedAt,
          actor: entry.actor || 'Not recorded',
          action: entry.action || entry.status || 'Work order updated',
          relatedId: complaint.workOrder.id || complaintId,
          previousValue: entry.previousValue || '',
          newValue: entry.status || '',
          notes: entry.note || '',
        });
      });
    });
    activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return res.json({ activity });
  } catch (error) {
    console.error('Admin activity log error:', error.message);
    return res.status(500).json({ message: 'Server error fetching activity log' });
  }
});

module.exports = router;
