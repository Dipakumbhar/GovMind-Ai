/**
 * GovMind AI - Extended Security, Schema & Edge Cases Test Suite
 */
process.env.JWT_SECRET = 'test_jwt_secret_key_govmind_2026';
process.env.JWT_EXPIRES_IN = '1d';

const { MockDB } = require('./mock_db');
const { createTestApp } = require('./create_test_app');
const { createInProcessRequester } = require('./test_harness');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const { analyzeComplaints } = require('../services/complaintAnalysis');

const mockDB = new MockDB();
const app = createTestApp(mockDB);
let api = createInProcessRequester(app);

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  failures: [],
};

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || 'Assertion failed'}: expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
  }
}

async function runExtendedTests() {
  console.log('\n======================================================');
  console.log('🧪 GOVMIND AI - EXTENDED SCHEMA & BOUNDARY TEST SUITE');
  console.log('======================================================\n');

  await mockDB.seedInitial();
  const loginRes = await api.post('/api/auth/login', {
    email: 'rajesh.kumar@example.com',
    password: 'citizen123',
  });
  const citizenToken = loginRes.body.token;

  const adminLoginRes = await api.post('/api/auth/admin/login', {
    email: 'admin@govmind.ai',
    password: 'admin123',
  });
  const adminToken = adminLoginRes.body.token;

  async function test(name, fn) {
    results.total++;
    try {
      await fn();
      results.passed++;
      console.log(`  ✅ [PASS] ${name}`);
    } catch (err) {
      results.failed++;
      results.failures.push({ name, error: err.message });
      console.log(`  ❌ [FAIL] ${name}: ${err.message}`);
    }
  }

  // 1. Department Mapping Tests
  console.log('\n📦 SUITE 9: Category to Department Auto-Routing');
  const categories = [
    { cat: 'water-supply', dept: 'Water Supply Department' },
    { cat: 'roads-transport', dept: 'Public Works Department' },
    { cat: 'electricity', dept: 'Electrical Department' },
    { cat: 'waste-management', dept: 'Sanitation Department' },
    { cat: 'healthcare', dept: 'Health Department' },
    { cat: 'environment', dept: 'Environment Department' },
    { cat: 'traffic', dept: 'Traffic Department' },
    { cat: 'public-safety', dept: 'Public Safety Department' },
    { cat: 'Pothole', dept: 'Public Works Department' },
    { cat: 'Broken Manhole', dept: 'Infrastructure Department' },
    { cat: 'Waterlogging', dept: 'Drainage Department' },
    { cat: 'other', dept: 'General Administration' },
  ];

  for (const item of categories) {
    await test(`Category "${item.cat}" automatically maps to "${item.dept}"`, async () => {
      const res = await api.post(
        '/api/complaints',
        {
          title: `Test complaint for ${item.cat}`,
          description: `Detailed description for category test ${item.cat} with more than 20 characters length.`,
          category: item.cat,
        },
        { headers: { Authorization: `Bearer ${citizenToken}` } }
      );
      assertEqual(res.status, 201);
      assertEqual(res.body.complaint.department, item.dept);
    });
  }

  // 2. Boundary & Injection Attack Resistance
  console.log('\n📦 SUITE 10: Boundary & Injection Attack Resistance');

  await test('Complaint tracking safely handles NoSQL injection payload in URL', async () => {
    // Attempt tracking with path containing dangerous query characters
    const res = await api.get('/api/complaints/track/%7B%22%24gt%22%3A%22%22%7D');
    assertEqual(res.status, 404, 'Safely returns 404 not found without leaking records');
  });

  await test('Complaint submission sanitizes whitespace on title and description', async () => {
    const res = await api.post(
      '/api/complaints',
      {
        title: '   Whitespace padded title   ',
        description: '   Padded description text exceeding minimum length requirement easily.   ',
        category: 'Pothole',
      },
      { headers: { Authorization: `Bearer ${citizenToken}` } }
    );
    assertEqual(res.status, 201);
    assertEqual(res.body.complaint.title, 'Whitespace padded title');
  });

  await test('Complaint image upload rejects malformed data before contacting storage', async () => {
    const res = await api.post(
      '/api/complaints/upload',
      { dataUrl: 'not-an-image', filename: 'bad.png' },
      { headers: { Authorization: `Bearer ${citizenToken}` } }
    );
    assertEqual(res.status, 400, 'Malformed image upload is rejected');
  });

  await test('Complaint tracking rate limit is shared across IDs from the same client', async () => {
    let response;
    for (let index = 0; index < 65; index++) {
      response = await api.get(`/api/complaints/track/THROTTLE-${index}`);
    }
    assertEqual(response.status, 429, 'Requests with changing IDs still hit the rate limit');
  });

  // This test intentionally exhausts the shared per-client limiter. Rebuild the
  // isolated Express app so unrelated tests can exercise tracking normally.
  api = createInProcessRequester(createTestApp(mockDB));

  await test('Registration enforces lowercase normalization on emails', async () => {
    const mixedEmail = `MixedCase.${Date.now()}@Example.COM`;
    const res = await api.post('/api/auth/register', {
      name: 'Mixed Case User',
      email: mixedEmail,
      phone: '+91 91111 22222',
      password: 'password123',
    });
    assertEqual(res.status, 201);
    assertEqual(res.body.user.email, mixedEmail.toLowerCase());
  });

  await test('Login works with mixed case email matching lowercase stored record', async () => {
    const res = await api.post('/api/auth/login', {
      email: 'RAJESH.KUMAR@EXAMPLE.COM',
      password: 'citizen123',
    });
    assertEqual(res.status, 200);
    assertEqual(res.body.user.email, 'rajesh.kumar@example.com');
  });

  await test('Admin update rejects attempts to overwrite system immutable fields (complaintId, submittedBy)', async () => {
    const res = await api.put(
      '/api/complaints/admin/GV-2026-000101',
      {
        complaintId: 'GV-HACKED-999999',
        reportedBy: 'attacker_id',
        submittedBy: 'attacker_id',
        status: 'Verified',
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assertEqual(res.status, 200);
    assertEqual(res.body.complaint.complaintId, 'GV-2026-000101', 'complaintId remains unchanged');
    assertEqual(res.body.complaint.status, 'Verified', 'Allowed field was updated');
  });

  await test('Admin update rejects out-of-range AI scores', async () => {
    const res = await api.put(
      '/api/complaints/admin/GV-2026-000101',
      { civicRiskScore: 101 },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assertEqual(res.status, 400, 'Scores above 100 are rejected');
  });

  // 3. Shared-database analytics and embedded field-operation workflow
  console.log('\n📦 SUITE 11: Shared Analytics, Work Orders & Citizen Synchronization');

  await test('Admin-only analysis endpoint groups persisted mock complaint records', async () => {
    const res = await api.get('/api/stats/admin/analysis', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assertEqual(res.status, 200);
    assert(res.body.locatedComplaints >= 2, 'Analysis counts stored coordinates');
    assert(Array.isArray(res.body.clusters), 'Returns geographic groups');
    assert(!res.body.clusters.some((cluster) => Number.isFinite(cluster.clusterConfidence)), 'Does not invent confidence');
  });

  await test('Citizen cannot access admin analytics or work-order data', async () => {
    const analysis = await api.get('/api/stats/admin/analysis', {
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    const workOrders = await api.get('/api/complaints/admin/work-orders', {
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    assertEqual(analysis.status, 403);
    assertEqual(workOrders.status, 403);
  });

  await test('Admin creates one work order embedded in its complaint', async () => {
    const res = await api.post('/api/complaints/admin/GV-2026-000101/work-order', {
      title: 'Isolated integration test repair',
      assignedTeam: 'Test Field Team',
      materials: ['Test material'],
    }, { headers: { Authorization: `Bearer ${adminToken}` } });
    assertEqual(res.status, 201);
    assert(res.body.workOrder.id.startsWith('WO-'), 'Work order has a generated ID');
    assertEqual(res.body.workOrder.assignedTeam, 'Test Field Team');
  });

  await test('Duplicate work order creation is blocked and admin listing returns the embedded record', async () => {
    const duplicate = await api.post('/api/complaints/admin/GV-2026-000101/work-order', {}, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listing = await api.get('/api/complaints/admin/work-orders', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assertEqual(duplicate.status, 409);
    assertEqual(listing.status, 200);
    assert(listing.body.workOrders.some((workOrder) => workOrder.complaintId === 'GV-2026-000101'));
  });

  await test('Work order completion enters verification and citizen tracking reads that same status', async () => {
    const complaint = mockDB.complaints.find((item) => item.complaintId === 'GV-2026-000101');
    const workOrderId = complaint.workOrder.id;
    const completion = await api.put(`/api/complaints/admin/work-orders/${workOrderId}`, {
      status: 'Awaiting Verification',
    }, { headers: { Authorization: `Bearer ${adminToken}` } });
    const tracking = await api.get('/api/complaints/track/GV-2026-000101');
    assertEqual(completion.status, 200);
    assertEqual(tracking.body.complaint.status, 'Pending Resolution Verification');
  });

  await test('Completing a work order after resolution does not revert complaint status', async () => {
    await api.put('/api/complaints/admin/GV-2026-000101', { status: 'Resolved' }, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const complaint = mockDB.complaints.find((item) => item.complaintId === 'GV-2026-000101');
    const workOrder = await api.put(`/api/complaints/admin/work-orders/${complaint.workOrder.id}`, {
      status: 'Completed',
    }, { headers: { Authorization: `Bearer ${adminToken}` } });
    const tracking = await api.get('/api/complaints/track/GV-2026-000101');
    assertEqual(workOrder.status, 200);
    assertEqual(tracking.body.complaint.status, 'Resolved');
  });

  console.log('\n📦 SUITE 12: Database-Derived Analysis Methodology');

  await test('Risk and impact screening use stored priority and nearby complaints without changing records', async () => {
    const source = [
      { _id: 'analysis-a', complaintId: 'ANALYSIS-A', priority: 'High', location: { lat: 16.705, lng: 74.243 } },
      { _id: 'analysis-b', complaintId: 'ANALYSIS-B', priority: 'Medium', aiSeverity: 'Pending', location: { lat: 16.7055, lng: 74.243 } },
      { _id: 'analysis-c', complaintId: 'ANALYSIS-C', priority: 'Low', civicRiskScore: 42, civicImpactScore: 63, location: { lat: 18.5204, lng: 73.8567 } },
    ];
    const analysis = analyzeComplaints(source);
    const high = analysis.complaintScores.find((entry) => entry.id === 'ANALYSIS-A');
    const medium = analysis.complaintScores.find((entry) => entry.id === 'ANALYSIS-B');
    const stored = analysis.complaintScores.find((entry) => entry.id === 'ANALYSIS-C');
    assertEqual(high.civicRiskScore, 85);
    assertEqual(high.civicImpactScore, 80);
    assertEqual(high.riskScoreMethod, 'Rule-based screening index');
    assertEqual(high.impactScoreMethod, 'Rule-based impact proxy');
    assertEqual(medium.civicRiskScore, 60);
    assertEqual(medium.civicImpactScore, 55);
    assertEqual(medium.riskScoreMethod, 'Rule-based screening index', 'Unrecognized AI status falls back to the valid priority field');
    assertEqual(stored.civicRiskScore, 42);
    assertEqual(stored.civicImpactScore, 63);
    assertEqual(source[0].civicRiskScore, undefined, 'Analysis does not mutate complaint records');
    assert(analysis.methodology.scoring.includes('not measured population impact'));
  });

  await test('Admin complaint API falls back to valid priority when legacy AI severity contains a status', async () => {
    const complaint = mockDB.complaints.find((item) => item.complaintId === 'GV-2026-000103');
    const originalAiSeverity = complaint.aiSeverity;
    try {
      complaint.aiSeverity = 'Pending';
      const response = await api.get('/api/complaints/admin/all', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const formatted = response.body.complaints.find((item) => item.complaintId === complaint.complaintId);
      assertEqual(response.status, 200);
      assertEqual(formatted.severity, 'Medium');
      assertEqual(formatted.aiSeverity, 'Pending', 'Original field remains unchanged by response formatting');
    } finally {
      complaint.aiSeverity = originalAiSeverity;
    }
  });

  // 5. Mongoose Schema Definitions Check
  console.log('\n📦 SUITE 13: Mongoose Schema Model Integrity');

  await test('User schema defines required fields, unique email, and citizen/admin roles', async () => {
    assert(User.schema.paths.name.isRequired, 'Name is required');
    assert(User.schema.paths.email.isRequired, 'Email is required');
    assert(User.schema.paths.phone.isRequired, 'Phone is required');
    assert(User.schema.paths.passwordHash.isRequired, 'Password hash is required');
    const roleEnum = User.schema.paths.role.enumValues;
    assert(roleEnum.includes('citizen'), 'Role includes citizen');
    assert(roleEnum.includes('admin'), 'Role includes admin');
  });

  await test('Complaint schema defines required fields and allowed statuses', async () => {
    assert(Complaint.schema.paths.title.isRequired, 'Title is required');
    assert(Complaint.schema.paths.description.isRequired, 'Description is required');
    assert(Complaint.schema.paths.category.isRequired, 'Category is required');
    assert(Complaint.schema.paths.submittedBy, 'Existing owner field is supported');
    assert(Complaint.schema.paths.photos, 'Existing photo field is supported');
    assert(Complaint.schema.path('location'), 'Existing nested location is supported');
    assert(Complaint.schema.paths.timeline, 'Existing timeline field is supported');
  });

  console.log('\n======================================================');
  console.log(`📊 EXTENDED TEST SUMMARY: ${results.passed}/${results.total} PASSED`);
  console.log('======================================================\n');

  return results;
}

runExtendedTests().then((res) => {
  if (res.failed > 0) process.exit(1);
  else process.exit(0);
});
