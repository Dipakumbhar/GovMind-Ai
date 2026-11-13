/**
 * GovMind AI - Comprehensive Automated Test Runner
 * Executes unit, integration, security, and end-to-end test suites.
 */
process.env.JWT_SECRET = 'test_jwt_secret_key_govmind_2026';
process.env.JWT_EXPIRES_IN = '1d';

const { MockDB } = require('./mock_db');
const { createTestApp } = require('./create_test_app');
const { createInProcessRequester } = require('./test_harness');

const mockDB = new MockDB();
const app = createTestApp(mockDB);
const api = createInProcessRequester(app);

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  suites: [],
  failures: [],
};

function suite(title, fn) {
  const currentSuite = { title, tests: [] };
  results.suites.push(currentSuite);
  return fn({
    test: async (name, testFn) => {
      results.total++;
      try {
        await testFn();
        results.passed++;
        currentSuite.tests.push({ name, status: 'PASSED' });
        console.log(`  ✅ [PASS] ${name}`);
      } catch (err) {
        results.failed++;
        const failure = { suite: title, name, error: err.message, stack: err.stack };
        results.failures.push(failure);
        currentSuite.tests.push({ name, status: 'FAILED', error: err.message });
        console.log(`  ❌ [FAIL] ${name}: ${err.message}`);
      }
    },
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || 'Assertion failed'}: expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
  }
}

async function runAllTests() {
  console.log('\n======================================================');
  console.log('🧪 GOVMIND AI - AUTOMATED QA TEST SUITE EXECUTION');
  console.log('======================================================\n');

  // Seed default data
  await mockDB.seedInitial();

  let citizenToken = '';
  let otherCitizenToken = '';
  let adminToken = '';
  let newlyCreatedComplaintId = '';

  // ───────────────────────────────────────────────────────────
  // SUITE 1: System Health & Baseline Connectivity
  // ───────────────────────────────────────────────────────────
  console.log('\n📦 SUITE 1: System Health & Baseline Connectivity');
  await suite('System Health', async ({ test }) => {
    await test('GET /api/health returns HTTP 200 with ok status', async () => {
      const res = await api.get('/api/health');
      assertEqual(res.status, 200, 'Health check status code');
      assertEqual(res.body.status, 'ok', 'Health status field');
      assert(res.body.database, 'Database field present');
    });

    await test('GET /api/nonexistent-route returns HTTP 404 Route not found', async () => {
      const res = await api.get('/api/nonexistent-route');
      assertEqual(res.status, 404, '404 status code');
      assertEqual(res.body.message, 'Route not found', '404 message');
    });
  });

  // ───────────────────────────────────────────────────────────
  // SUITE 2: Citizen Authentication & Account Management
  // ───────────────────────────────────────────────────────────
  console.log('\n📦 SUITE 2: Citizen Authentication & Account Management');
  await suite('Citizen Auth', async ({ test }) => {
    await test('POST /api/auth/register creates citizen account (Positive)', async () => {
      const res = await api.post('/api/auth/register', {
        name: 'Sunita Patil',
        email: 'sunita.patil@example.com',
        phone: '+91 91234 56789',
        password: 'securepassword123',
        ward: 'Ward 02 - Shahupuri',
      });
      assertEqual(res.status, 201, 'Registration status code');
      assertEqual(res.body.user.role, 'citizen', 'New user role is citizen');
      assertEqual(res.body.user.email, 'sunita.patil@example.com', 'Registered email');
      assert(res.body.token, 'JWT token returned on registration');
      otherCitizenToken = res.body.token;
      assert(!res.body.user.password, 'Password hash omitted from response');
      assert(!res.body.user.passwordHash, 'Stored password hash omitted from response');
      const storedUser = mockDB.users.find((user) => user.email === 'sunita.patil@example.com');
      assert(storedUser.passwordHash.startsWith('$2'), 'New passwords are stored as bcrypt hashes');
    });

    await test('POST /api/auth/register rejects missing required fields (Negative)', async () => {
      const res = await api.post('/api/auth/register', {
        name: 'Incomplete User',
        email: 'incomplete@example.com',
        // Missing phone and password
      });
      assertEqual(res.status, 400, '400 on missing required fields');
    });

    await test('POST /api/auth/register rejects duplicate email (Negative)', async () => {
      const res = await api.post('/api/auth/register', {
        name: 'Duplicate User',
        email: 'sunita.patil@example.com',
        phone: '+91 99999 88888',
        password: 'password123',
      });
      assertEqual(res.status, 400, '400 on duplicate email');
      assert(res.body.message.includes('already exists'), 'Duplicate email error message');
    });

    await test('POST /api/auth/login logs in valid citizen user (Positive)', async () => {
      const res = await api.post('/api/auth/login', {
        email: 'rajesh.kumar@example.com',
        password: 'citizen123',
      });
      assertEqual(res.status, 200, 'Login status code');
      assertEqual(res.body.user.email, 'rajesh.kumar@example.com', 'User email match');
      assertEqual(res.body.user.role, 'citizen', 'Role is citizen');
      assert(res.body.token, 'Auth token returned');
      citizenToken = res.body.token; // Save for subsequent tests
    });

    await test('POST /api/auth/login rejects incorrect password (Negative)', async () => {
      const res = await api.post('/api/auth/login', {
        email: 'rajesh.kumar@example.com',
        password: 'wrong_password_999',
      });
      assertEqual(res.status, 401, '401 on wrong password');
      assertEqual(res.body.message, 'Invalid email or password');
    });

    await test('POST /api/auth/login rejects non-existent email (Negative)', async () => {
      const res = await api.post('/api/auth/login', {
        email: 'ghost_user@example.com',
        password: 'somepassword',
      });
      assertEqual(res.status, 401, '401 on non-existent user');
    });

    await test('GET /api/auth/me returns current user profile with valid token (Positive)', async () => {
      const res = await api.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${citizenToken}` },
      });
      assertEqual(res.status, 200, 'Status 200 for authenticated profile');
      assertEqual(res.body.user.name, 'Rajesh Kumar');
      assertEqual(res.body.user.email, 'rajesh.kumar@example.com');
      assert(!res.body.user.password, 'Password hash omitted from /me response');
    });

    await test('GET /api/auth/me rejects unauthenticated request (Security)', async () => {
      const res = await api.get('/api/auth/me');
      assertEqual(res.status, 401, '401 on missing auth token');
    });

    await test('PUT /api/auth/profile updates citizen phone, ward, and language (Positive)', async () => {
      const res = await api.put(
        '/api/auth/profile',
        {
          name: 'Rajesh Kumar Updated',
          phone: '+91 98765 99999',
          ward: 'Ward 05 - Station Road Central',
          preferredLanguage: 'Marathi',
        },
        { headers: { Authorization: `Bearer ${citizenToken}` } }
      );
      assertEqual(res.status, 200, '200 on profile update');
      assertEqual(res.body.user.phone, '+91 98765 99999');
      assertEqual(res.body.user.preferredLanguage, 'Marathi');
    });

    await test('PUT /api/auth/profile saves boolean notification preferences', async () => {
      const res = await api.put(
        '/api/auth/profile',
        { notificationPreferences: { email: false, statusUpdates: true } },
        { headers: { Authorization: `Bearer ${citizenToken}` } }
      );
      assertEqual(res.status, 200);
      assertEqual(res.body.user.notificationPreferences.email, false);
      assertEqual(res.body.user.notificationPreferences.statusUpdates, true);
    });

    await test('PUT /api/auth/password checks the current password before saving', async () => {
      const wrongCurrent = await api.put(
        '/api/auth/password',
        { currentPassword: 'not-the-current-password', newPassword: 'replacement-password' },
        { headers: { Authorization: `Bearer ${citizenToken}` } }
      );
      assertEqual(wrongCurrent.status, 400, 'Wrong current password is rejected');

      const changed = await api.put(
        '/api/auth/password',
        { currentPassword: 'citizen123', newPassword: 'replacement-password' },
        { headers: { Authorization: `Bearer ${citizenToken}` } }
      );
      assertEqual(changed.status, 200, 'Password changes with the current password');

      const restored = await api.put(
        '/api/auth/password',
        { currentPassword: 'replacement-password', newPassword: 'citizen123' },
        { headers: { Authorization: `Bearer ${citizenToken}` } }
      );
      assertEqual(restored.status, 200, 'Test fixture password restored');
    });
  });

  // ───────────────────────────────────────────────────────────
  // SUITE 3: Administrator Authentication & Role Separation
  // ───────────────────────────────────────────────────────────
  console.log('\n📦 SUITE 3: Administrator Authentication & Role Separation');
  await suite('Admin Auth & Role Separation', async ({ test }) => {
    await test('POST /api/auth/admin/login authenticates municipal admin (Positive)', async () => {
      const res = await api.post('/api/auth/admin/login', {
        email: 'admin@govmind.ai',
        password: 'admin123',
      });
      assertEqual(res.status, 200, 'Admin login status 200');
      assertEqual(res.body.user.role, 'admin', 'User role is admin');
      assert(res.body.token, 'Admin JWT token returned');
      adminToken = res.body.token; // Save for admin suites
    });

    await test('POST /api/auth/admin/login rejects citizen user with 403 Forbidden (Security)', async () => {
      const res = await api.post('/api/auth/admin/login', {
        email: 'rajesh.kumar@example.com',
        password: 'citizen123',
      });
      assertEqual(res.status, 403, '403 Forbidden when citizen attempts admin login');
      assert(res.body.message.includes('restricted to authorized municipal administrators'), 'Forbidden message');
    });

    await test('POST /api/auth/admin/login rejects invalid admin password (Negative)', async () => {
      const res = await api.post('/api/auth/admin/login', {
        email: 'admin@govmind.ai',
        password: 'wrong_admin_password',
      });
      assertEqual(res.status, 401, '401 for wrong admin password');
    });
  });

  // ───────────────────────────────────────────────────────────
  // SUITE 4: Citizen Complaint Operations (CRUD & Tracking)
  // ───────────────────────────────────────────────────────────
  console.log('\n📦 SUITE 4: Citizen Complaint Operations');
  await suite('Citizen Complaint Operations', async ({ test }) => {
    await test('POST /api/complaints submits new civic complaint (Positive)', async () => {
      const res = await api.post(
        '/api/complaints',
        {
          title: 'Deep crater on Tarabai Park 4th Lane',
          description: 'A deep pothole has appeared following heavy rain. Poses accident risk to cyclists and senior citizens.',
          category: 'Pothole',
          location: '4th Lane, opposite City Garden, Tarabai Park',
          ward: 'Ward 04 - Tarabai Park',
          pincode: '416003',
          lat: 16.7115,
          lng: 74.2392,
          media: [{
            name: 'road-test.png',
            size: '128',
            type: 'image/png',
            url: 'https://res.cloudinary.com/govmind/image/upload/test/road-test.png',
            publicId: 'test/road-test',
          }],
        },
        { headers: { Authorization: `Bearer ${citizenToken}` } }
      );
      assertEqual(res.status, 201, 'Complaint created status 201');
      assert(res.body.complaint.complaintId.startsWith('GV-2026-'), 'Complaint ID format GV-2026-XXXXXX');
      assertEqual(res.body.complaint.status, 'submitted', 'Default status is submitted');
      assertEqual(res.body.complaint.department, 'Public Works Department', 'Auto-assigned department');
      assertEqual(res.body.complaint.timeline.length, 1, 'Initial timeline entry logged');
      assertEqual(typeof res.body.complaint.location, 'string', 'Frontend receives normalized location text');
      const storedComplaint = mockDB.complaints.find((item) => item.complaintId === res.body.complaint.complaintId);
      assertEqual(typeof storedComplaint.location, 'object', 'Database stores nested location');
      const citizen = mockDB.users.find((user) => user.email === 'rajesh.kumar@example.com');
      assertEqual(String(storedComplaint.submittedBy), String(citizen._id), 'Database uses the existing submittedBy owner field');
      assertEqual(storedComplaint.photos[0].publicId, 'test/road-test', 'Database stores photo metadata in the existing photos structure');
      assertEqual(res.body.complaint.images[0], storedComplaint.photos[0].url, 'Admin image URL alias is available');
      newlyCreatedComplaintId = res.body.complaint.complaintId;
    });

    await test('POST /api/complaints rejects submission with missing title/desc/category (Negative)', async () => {
      const res = await api.post(
        '/api/complaints',
        {
          title: '',
          description: '',
          category: '',
        },
        { headers: { Authorization: `Bearer ${citizenToken}` } }
      );
      assertEqual(res.status, 400, '400 on missing required fields');
    });

    await test('POST /api/complaints rejects unauthenticated submission (Security)', async () => {
      const res = await api.post('/api/complaints', {
        title: 'Unauthorized complaint',
        description: 'Should not be allowed without token',
        category: 'Pothole',
      });
      assertEqual(res.status, 401, '401 for unauthenticated submission');
    });

    await test('GET /api/complaints/my retrieves complaints for logged-in citizen (Positive)', async () => {
      const res = await api.get('/api/complaints/my', {
        headers: { Authorization: `Bearer ${citizenToken}` },
      });
      assertEqual(res.status, 200, '200 for my complaints');
      assert(Array.isArray(res.body.complaints), 'Returns array of complaints');
      assert(res.body.complaints.length >= 2, 'Contains citizen seeded complaints + newly submitted');
      assert(res.body.complaints.some((item) => item.submittedBy), 'Existing-schema submittedBy complaints are returned');
    });

    await test('GET /api/complaints/track/:id tracks complaint by ID (Public Access)', async () => {
      const res = await api.get(`/api/complaints/track/${newlyCreatedComplaintId}`);
      assertEqual(res.status, 200, '200 on tracking existing complaint');
      assertEqual(res.body.complaint.complaintId, newlyCreatedComplaintId, 'Complaint ID matches');
      assertEqual(res.body.complaint.status, 'submitted', 'Status is submitted');
      assert(Array.isArray(res.body.complaint.timeline), 'Timeline is an array');
    });

    await test('GET /api/complaints/track/:id handles case-insensitive complaint ID (Boundary)', async () => {
      const lowerId = newlyCreatedComplaintId.toLowerCase();
      const res = await api.get(`/api/complaints/track/${lowerId}`);
      assertEqual(res.status, 200, '200 on case-insensitive ID tracking');
      assertEqual(res.body.complaint.complaintId, newlyCreatedComplaintId);
    });

    await test('GET /api/complaints/track/:id returns 404 for invalid ID (Negative)', async () => {
      const res = await api.get('/api/complaints/track/GV-9999-999999');
      assertEqual(res.status, 404, '404 for non-existent complaint ID');
      assertEqual(res.body.message, 'Complaint not found');
    });

    await test('GET /api/complaints/detail/:id returns full complaint details (Positive)', async () => {
      const res = await api.get(`/api/complaints/detail/${newlyCreatedComplaintId}`, {
        headers: { Authorization: `Bearer ${citizenToken}` },
      });
      assertEqual(res.status, 200, '200 on detail view');
      assertEqual(res.body.complaint.complaintId, newlyCreatedComplaintId);
    });

    await test('GET /api/complaints/detail/:id blocks another citizen from private complaint details (Security)', async () => {
      const res = await api.get(`/api/complaints/detail/${newlyCreatedComplaintId}`, {
        headers: { Authorization: `Bearer ${otherCitizenToken}` },
      });
      assertEqual(res.status, 403, '403 on another citizen’s complaint details');
    });
  });

  // ───────────────────────────────────────────────────────────
  // SUITE 5: Admin Complaint Management & Role Authorization
  // ───────────────────────────────────────────────────────────
  console.log('\n📦 SUITE 5: Admin Complaint Management & Role Authorization');
  await suite('Admin Complaint Management', async ({ test }) => {
    await test('GET /api/complaints/admin/all returns all complaints to admin (Positive)', async () => {
      const res = await api.get('/api/complaints/admin/all', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assertEqual(res.status, 200, '200 for admin get all');
      assert(Array.isArray(res.body.complaints), 'Returns array of complaints');
      assert(res.body.complaints.length >= 4, 'Contains all complaints across all citizens');
    });

    await test('GET /api/complaints/admin/all rejects citizen token with 403 Forbidden (Security)', async () => {
      const res = await api.get('/api/complaints/admin/all', {
        headers: { Authorization: `Bearer ${citizenToken}` },
      });
      assertEqual(res.status, 403, '403 Forbidden when citizen calls admin endpoint');
      assertEqual(res.body.message, 'Access denied. Admin only.');
    });

    await test('PUT /api/complaints/admin/:id updates status, team, priority (Positive)', async () => {
      const res = await api.put(
        `/api/complaints/admin/${newlyCreatedComplaintId}`,
        {
          status: 'Repair In Progress',
          priority: 'high',
          assignedTeam: 'Field Team Beta (FT-002)',
          departmentUpdate: 'Work order issued. Asphalt repair truck dispatched.',
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      assertEqual(res.status, 200, '200 on admin complaint update');
      assertEqual(res.body.complaint.status, 'Repair In Progress', 'Updated status');
      assertEqual(res.body.complaint.assignedTeam, 'Field Team Beta (FT-002)', 'Assigned team');
      // Verify timeline recorded update
      const timeline = res.body.complaint.timeline;
      assert(timeline.length >= 2, 'Timeline includes update event');
      assertEqual(timeline[timeline.length - 1].status, 'Repair In Progress');
    });

    await test('PUT /api/complaints/admin/:id rejects citizen token with 403 Forbidden (Security)', async () => {
      const res = await api.put(
        `/api/complaints/admin/${newlyCreatedComplaintId}`,
        { status: 'Resolved' },
        { headers: { Authorization: `Bearer ${citizenToken}` } }
      );
      assertEqual(res.status, 403, '403 Forbidden when citizen attempts admin update');
    });

    await test('POST /api/complaints/admin/:id/history adds audit trail entry (Positive)', async () => {
      const res = await api.post(
        `/api/complaints/admin/${newlyCreatedComplaintId}/history`,
        {
          action: 'Site Inspection Conducted',
          actor: 'Er. Priya Sharma',
          note: 'Excavation completed, laying crushed stone base course.',
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      assertEqual(res.status, 200, '200 on adding history entry');
      const history = res.body.complaint.history;
      assert(history.length >= 1, 'History entry added');
      assertEqual(history[history.length - 1].action, 'Site Inspection Conducted');
    });

    await test('POST /api/complaints/admin/:id/history rejects citizen token with 403 Forbidden (Security)', async () => {
      const res = await api.post(
        `/api/complaints/admin/${newlyCreatedComplaintId}/history`,
        { action: 'Tampered Audit Log', actor: 'Hacker' },
        { headers: { Authorization: `Bearer ${citizenToken}` } }
      );
      assertEqual(res.status, 403, '403 Forbidden when citizen attempts to add history');
    });
  });

  // ───────────────────────────────────────────────────────────
  // SUITE 6: Cross-Panel Synchronization & Citizen Feedback
  // ───────────────────────────────────────────────────────────
  console.log('\n📦 SUITE 6: Cross-Panel Synchronization & Citizen Feedback');
  await suite('Cross-Panel Sync & Feedback', async ({ test }) => {
    await test('Citizen cannot submit feedback before a complaint is resolved (Security)', async () => {
      const res = await api.post(
        `/api/complaints/${newlyCreatedComplaintId}/feedback`,
        { feedback: 'Testing feedback before resolution.' },
        { headers: { Authorization: `Bearer ${citizenToken}` } }
      );
      assertEqual(res.status, 409, '409 before resolution');
    });

    await test('Citizen cannot submit feedback on another citizen’s complaint (Security)', async () => {
      const res = await api.post(
        '/api/complaints/GV-2026-000102/feedback',
        { feedback: 'Unauthorized feedback attempt.' },
        { headers: { Authorization: `Bearer ${otherCitizenToken}` } }
      );
      assertEqual(res.status, 403, '403 on another citizen’s feedback');
    });

    await test('Citizen public tracking reflects admin updates immediately (Integration)', async () => {
      const res = await api.get(`/api/complaints/track/${newlyCreatedComplaintId}`);
      assertEqual(res.status, 200, '200 for citizen track');
      assertEqual(res.body.complaint.status, 'Repair In Progress', 'Citizen sees updated status');
      assertEqual(
        res.body.complaint.departmentUpdate,
        'Work order issued. Asphalt repair truck dispatched.',
        'Citizen sees admin department update note'
      );
    });

    await test('Admin resolves complaint, citizen tracks resolved status (Integration)', async () => {
      // Admin marks resolved
      const adminRes = await api.put(
        `/api/complaints/admin/${newlyCreatedComplaintId}`,
        {
          status: 'Resolved',
          departmentUpdate: 'Pothole asphalt patch sealed, compacted, and leveled. Road cleared.',
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      assertEqual(adminRes.status, 200);
      assertEqual(adminRes.body.complaint.status, 'Resolved');

      // Citizen tracks resolution
      const trackRes = await api.get(`/api/complaints/track/${newlyCreatedComplaintId}`);
      assertEqual(trackRes.body.complaint.status, 'Resolved');
    });

    await test('Citizen submits resolution satisfaction feedback (Positive)', async () => {
      const res = await api.post(
        `/api/complaints/${newlyCreatedComplaintId}/feedback`,
        { feedback: 'Excellent turnaround time! Road surface is completely smooth now. Thank you.' },
        { headers: { Authorization: `Bearer ${citizenToken}` } }
      );
      assertEqual(res.status, 200, '200 on feedback submit');
      assertEqual(
        res.body.complaint.citizenFeedback,
        'Excellent turnaround time! Road surface is completely smooth now. Thank you.'
      );
    });

    await test('Admin sees citizen feedback in admin portal record (Integration)', async () => {
      const res = await api.get('/api/complaints/admin/all', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const resolved = res.body.complaint = res.body.complaints.find(
        (c) => c.complaintId === newlyCreatedComplaintId
      );
      assert(resolved, 'Complaint found in admin view');
      assertEqual(
        resolved.citizenFeedback,
        'Excellent turnaround time! Road surface is completely smooth now. Thank you.'
      );
    });
  });

  // ───────────────────────────────────────────────────────────
  // SUITE 7: Overview Statistics
  // ───────────────────────────────────────────────────────────
  console.log('\n📦 SUITE 7: Public Overview Statistics');
  await suite('Overview Stats', async ({ test }) => {
    await test('GET /api/stats/overview computes counts accurately (Positive)', async () => {
      const res = await api.get('/api/stats/overview');
      assertEqual(res.status, 200, '200 for stats overview');
      assert(typeof res.body.totalComplaints === 'number', 'totalComplaints is number');
      assert(typeof res.body.resolvedComplaints === 'number', 'resolvedComplaints is number');
      assert(typeof res.body.inProgressComplaints === 'number', 'inProgressComplaints is number');
      assert(res.body.totalComplaints >= 4, 'Total includes all seeded + created complaints');
      assert(res.body.resolvedComplaints >= 2, 'Resolved count accurate');
    });
  });

  // ───────────────────────────────────────────────────────────
  // SUITE 8: Application Security & Token Tampering Audit
  // ───────────────────────────────────────────────────────────
  console.log('\n📦 SUITE 8: Application Security & Token Tampering Audit');
  await suite('Security & Token Tampering', async ({ test }) => {
    await test('Malformed Bearer token rejected with 401', async () => {
      const res = await api.get('/api/auth/me', {
        headers: { Authorization: 'Bearer this_is_a_completely_invalid_jwt_token' },
      });
      assertEqual(res.status, 401, '401 on malformed token');
      assertEqual(res.body.message, 'Not authorized, token invalid');
    });

    await test('Token signed with wrong JWT secret rejected with 401', async () => {
      const jwt = require('jsonwebtoken');
      const forgedToken = jwt.sign({ id: 'user_1001', role: 'admin' }, 'wrong_secret_attacker');
      const res = await api.get('/api/complaints/admin/all', {
        headers: { Authorization: `Bearer ${forgedToken}` },
      });
      assertEqual(res.status, 401, '401 on forged secret token');
    });

    await test('Missing Authorization header on protected route rejected with 401', async () => {
      const res = await api.get('/api/complaints/admin/all');
      assertEqual(res.status, 401, '401 on missing auth header');
      assertEqual(res.body.message, 'Not authorized, no token');
    });

    await test('Empty Authorization header string rejected with 401', async () => {
      const res = await api.get('/api/complaints/admin/all', {
        headers: { Authorization: '' },
      });
      assertEqual(res.status, 401, '401 on empty auth header');
    });
  });

  // ───────────────────────────────────────────────────────────
  // Summary Report
  // ───────────────────────────────────────────────────────────
  console.log('\n======================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${results.passed}/${results.total} PASSED`);
  if (results.failed > 0) {
    console.log(`❌ FAILURES: ${results.failed}`);
    results.failures.forEach((f) => {
      console.log(`  - [${f.suite}] ${f.name}: ${f.error}`);
    });
  } else {
    console.log('🎉 ALL AUTOMATED TESTS PASSED WITH 100% SUCCESS RATE!');
  }
  console.log('======================================================\n');

  return results;
}

runAllTests().then((res) => {
  if (res.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
});
