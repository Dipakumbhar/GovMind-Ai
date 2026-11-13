const mongoose = require('mongoose');

// Match the existing Atlas shape. `strict: false` preserves legacy and future
// analysis fields when an existing complaint is updated and saved.
const locationSchema = new mongoose.Schema({
  address: { type: String, default: undefined },
  ward: { type: String, default: undefined },
  pincode: { type: String, default: undefined },
  lat: { type: Number, default: undefined },
  lng: { type: Number, default: undefined },
}, { _id: false, strict: false });

const photoSchema = new mongoose.Schema({
  url: { type: String, default: undefined },
  publicId: { type: String, default: undefined },
}, { _id: false, strict: false });

const complaintSchema = new mongoose.Schema(
  {
    complaintId: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    location: { type: locationSchema, default: undefined },
    photos: { type: [photoSchema], default: undefined },
    status: { type: String },
    priority: { type: String },
    department: { type: String },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timeline: { type: [mongoose.Schema.Types.Mixed], default: undefined },
  },
  { timestamps: true, strict: false, autoIndex: false }
);

// Use the existing `complaints` collection; no index creation or migration.
module.exports = mongoose.model('Complaint', complaintSchema, 'complaints');
