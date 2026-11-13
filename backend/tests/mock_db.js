/**
 * GovMind AI - In-Memory Database Mock for Deterministic Testing
 * Replicates Mongoose models, methods, hooks, and queries.
 */
const bcrypt = require('bcryptjs');

let userSeq = 1000;
let complaintSeq = 1000;

class MockUserDoc {
  constructor(data) {
    this._id = data._id || `user_${++userSeq}`;
    this.name = data.name || '';
    this.email = (data.email || '').toLowerCase();
    this.phone = data.phone || '';
    this.passwordHash = data.passwordHash || data.password || '';
    this.ward = data.ward || '';
    this.address = data.address || '';
    this.city = data.city || '';
    this.preferredLanguage = data.preferredLanguage || 'English';
    this.role = data.role || 'citizen';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  async comparePassword(candidatePassword) {
    if (this.passwordHash.startsWith('$2')) {
      return bcrypt.compare(candidatePassword, this.passwordHash);
    }
    return candidatePassword === this.passwordHash;
  }

  toJSON() {
    const copy = { ...this };
    delete copy.password;
    delete copy.passwordHash;
    return copy;
  }

  toObject() {
    return { ...this };
  }

  set(field, value) {
    this[field] = value;
  }

  async save() {
    if (this.passwordHash && !this.passwordHash.startsWith('$2')) {
      this.passwordHash = await bcrypt.hash(this.passwordHash, await bcrypt.genSalt(10));
    }
    this.updatedAt = new Date().toISOString();
    return this;
  }
}

class MockComplaintDoc {
  constructor(data) {
    this._id = data._id || `comp_${++complaintSeq}`;
    this.complaintId =
      data.complaintId ||
      `GV-2026-${String(Math.floor(Math.random() * 900000) + 100000)}`;
    this.title = data.title || '';
    this.description = data.description || '';
    this.category = data.category || '';
    this.location = data.location || {};
    this.ward = data.ward || '';
    this.pincode = data.pincode || '';
    this.coordinates = data.coordinates;
    this.status = data.status || 'submitted';
    this.priority = data.priority || 'medium';
    this.severity = data.severity || 'Medium';
    this.submittedBy = data.submittedBy || data.reportedBy;
    this.reportedBy = data.reportedBy || data.submittedBy;
    this.reporterName = data.reporterName || 'Citizen';
    this.reporterPhone = data.reporterPhone || '';
    this.department = data.department || '';
    this.assignedTeam = data.assignedTeam || null;
    this.zone = data.zone || '';
    this.aiSeverity = data.aiSeverity || '';
    this.aiCategory = data.aiCategory || '';
    this.aiConfidence = data.aiConfidence ?? null;
    this.aiExplanation = data.aiExplanation || '';
    this.civicImpactScore = data.civicImpactScore ?? null;
    this.civicRiskScore = data.civicRiskScore ?? null;
    this.riskFactors = data.riskFactors || [];
    this.clusterId = data.clusterId || null;
    this.duplicateOf = data.duplicateOf || null;
    this.photos = data.photos || (data.media || []).map(({ url, publicId }) => ({ url, publicId }));
    this.media = data.media || this.photos.map(({ url, publicId }) => ({ url, publicId }));
    this.images = data.images || [];
    this.departmentUpdate = data.departmentUpdate || null;
    this.citizenFeedback = data.citizenFeedback || null;
    this.timeline = data.timeline ? [...data.timeline] : [];
    this.history = data.history ? [...data.history] : [];
    this.dateSubmitted = data.dateSubmitted || new Date().toISOString().slice(0, 10);
    this.reportedDate = data.reportedDate || this.dateSubmitted;
    this.lastUpdated = data.lastUpdated || this.dateSubmitted;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  toObject() {
    return JSON.parse(JSON.stringify(this));
  }

  set(field, value) {
    this[field] = value;
  }

  async save() {
    this.lastUpdated = new Date().toISOString().slice(0, 10);
    this.updatedAt = new Date().toISOString();
    return this;
  }
}

class MockDB {
  constructor() {
    this.users = [];
    this.complaints = [];
  }

  clear() {
    this.users = [];
    this.complaints = [];
  }

  // ─── USER MODEL ───────────────────────────────────────────
  getUserModel() {
    const db = this;

    return {
      async create(doc) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(doc.passwordHash || doc.password, salt);
        const user = new MockUserDoc({ ...doc, passwordHash: hashedPassword });
        db.users.push(user);
        return user;
      },

      findOne(query) {
        if (!query) return null;
        let found = null;
        if (query.email) {
          const target = String(query.email).toLowerCase();
          found = db.users.find((u) => u.email.toLowerCase() === target) || null;
        } else if (query._id) {
          found = db.users.find((u) => String(u._id) === String(query._id)) || null;
        }
        return {
          select() { return Promise.resolve(found); },
          then(resolve, reject) { return Promise.resolve(found).then(resolve, reject); },
          catch(reject) { return Promise.resolve(found).catch(reject); },
        };
      },

      findById(id) {
        const query = {
          select(fields) {
            const user = db.users.find((u) => String(u._id) === String(id));
            return Promise.resolve(user || null);
          },
          then(resolve, reject) {
            const user = db.users.find((u) => String(u._id) === String(id));
            return Promise.resolve(user || null).then(resolve, reject);
          },
        };
        return query;
      },
    };
  }

  // ─── COMPLAINT MODEL ──────────────────────────────────────
  getComplaintModel() {
    const db = this;

    return {
      async create(doc) {
        const complaint = new MockComplaintDoc(doc);
        db.complaints.push(complaint);
        return complaint;
      },

      async findOne(query) {
        if (!query) return null;

        // Support $or queries used by buildIdQuery: [{ complaintId }, { complaintId: UPPER }, { _id }]
        if (query.$or && Array.isArray(query.$or)) {
          for (const item of query.$or) {
            if (item.complaintId) {
              const target = String(item.complaintId).toLowerCase();
              const found = db.complaints.find(
                (c) =>
                  c.complaintId.toLowerCase() === target ||
                  String(c._id).toLowerCase() === target
              );
              if (found) return found;
            }
            if (item._id) {
              const target = String(item._id);
              const found = db.complaints.find(
                (c) => String(c._id) === target || c.complaintId === target
              );
              if (found) return found;
            }
          }
          return null;
        }

        if (query.complaintId) {
          return (
            db.complaints.find(
              (c) => c.complaintId.toLowerCase() === String(query.complaintId).toLowerCase()
            ) || null
          );
        }

        if (query._id) {
          return (
            db.complaints.find((c) => String(c._id) === String(query._id)) || null
          );
        }

        return null;
      },

      find(query = {}) {
        let list = [...db.complaints];
        if (query.$or && Array.isArray(query.$or)) {
          const ids = query.$or.map((item) => item.submittedBy || item.reportedBy).filter(Boolean);
          list = list.filter((c) => ids.some((id) => String(c.submittedBy || c.reportedBy) === String(id)));
        } else if (query.reportedBy || query.submittedBy) {
          const id = query.reportedBy || query.submittedBy;
          list = list.filter(
            (c) => String(c.submittedBy || c.reportedBy) === String(id)
          );
        }

        return {
          sort(sortCriteria) {
            // Sort by createdAt descending
            list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            return Promise.resolve(list);
          },
          then(resolve, reject) {
            return Promise.resolve(list).then(resolve, reject);
          },
        };
      },

      async countDocuments(query = {}) {
        if (!query || Object.keys(query).length === 0) {
          return db.complaints.length;
        }
        if (query.status && query.status.$in) {
          const validStatuses = query.status.$in.map((s) => s.toLowerCase());
          return db.complaints.filter((c) =>
            validStatuses.includes(c.status.toLowerCase())
          ).length;
        }
        return db.complaints.length;
      },

      async insertMany(docs) {
        const created = docs.map((d) => new MockComplaintDoc(d));
        db.complaints.push(...created);
        return created;
      },
    };
  }

  // ─── SEED INITIAL DATA ────────────────────────────────────
  async seedInitial() {
    this.clear();
    const User = this.getUserModel();
    const Complaint = this.getComplaintModel();

    // 1. Admin
    const admin = await User.create({
      name: 'Municipal Administrator',
      email: 'admin@govmind.ai',
      phone: '+91 98000 11111',
      password: 'admin123',
      role: 'admin',
      ward: 'Central Office',
      city: 'Kolhapur',
    });

    // 2. Demo Citizen
    const citizen = await User.create({
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@example.com',
      phone: '+91 98765 43210',
      password: 'citizen123',
      role: 'citizen',
      ward: 'Ward 05 - Station Road',
      address: '42, MG Road, Sector 3',
      city: 'Kolhapur',
    });

    // 3. Initial Complaints
    await Complaint.insertMany([
      {
        complaintId: 'GV-2026-000101',
        title: 'Deep pothole cluster near Station Road junction',
        description:
          'A cluster of three large potholes causing vehicle slow-down.',
        category: 'Pothole',
        location: { address: 'Station Road Junction, near Central Bank', ward: 'Ward 05 - Station Road', pincode: '416001', lat: 16.705, lng: 74.2433 },
        status: 'Repair In Progress',
        priority: 'high',
        severity: 'High',
        submittedBy: citizen._id,
        reporterName: citizen.name,
        reporterPhone: citizen.phone,
        department: 'Public Works Department',
        assignedTeam: 'Field Team Alpha (FT-001)',
        zone: 'Zone A - Central',
        dateSubmitted: '2026-10-15',
        departmentUpdate: 'Cold asphalt patching in progress.',
        timeline: [
          {
            date: '2026-10-15',
            status: 'submitted',
            action: 'Complaint Submitted',
            actor: 'Citizen',
            note: 'Reported with GPS',
          },
        ],
        history: [
          {
            date: '2026-10-15',
            action: 'Created',
            actor: 'Citizen',
            note: 'Initial report',
          },
        ],
      },
      {
        complaintId: 'GV-2026-000102',
        title: 'Damaged manhole cover on Rankala Road promenade',
        description: 'Cast iron manhole cover cracked and partially displaced.',
        category: 'Broken Manhole',
        location: { address: 'Opposite Rankala Lake Gate 2', ward: 'Ward 03 - Rankala', pincode: '416012', lat: 16.6912, lng: 74.2185 },
        status: 'Resolved',
        priority: 'critical',
        severity: 'Critical',
        submittedBy: citizen._id,
        reporterName: citizen.name,
        reporterPhone: citizen.phone,
        department: 'Infrastructure Department',
        assignedTeam: 'Emergency Response Unit (ERU-2)',
        zone: 'Zone C - South',
        dateSubmitted: '2026-10-10',
        departmentUpdate: 'Ductile iron cover installed and perimeter reinforced.',
        citizenFeedback: 'Prompt replacement within 48 hours.',
        timeline: [
          {
            date: '2026-10-10',
            status: 'submitted',
            action: 'Complaint Submitted',
            actor: 'Citizen',
            note: 'Urgent notice',
          },
          {
            date: '2026-10-12',
            status: 'resolved',
            action: 'Resolved',
            actor: 'Admin',
            note: 'Inspection passed',
          },
        ],
        history: [],
      },
      {
        complaintId: 'GV-2026-000103',
        title: 'Water pipe leak leading to road waterlogging',
        description: 'Potable water pipeline rupture underneath Tarabai Park main road.',
        category: 'water-supply',
        location: { address: 'Tarabai Park, near Circle 3', ward: 'Ward 04 - Tarabai Park', pincode: '416003' },
        status: 'submitted',
        priority: 'medium',
        severity: 'Medium',
        submittedBy: citizen._id,
        reporterName: citizen.name,
        reporterPhone: citizen.phone,
        department: 'Water Supply Department',
        zone: 'Zone B - North',
        dateSubmitted: '2026-11-01',
        timeline: [
          {
            date: '2026-11-01',
            status: 'submitted',
            action: 'Complaint Submitted',
            actor: 'Citizen',
            note: 'Forwarded to Water Works',
          },
        ],
        history: [],
      },
    ]);

    return { admin, citizen };
  }
}

module.exports = { MockDB };
