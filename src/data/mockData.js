/**
 * Mock data for GovMind AI Citizen Portal
 * 
 * NOTE: This is demo/mock data for development purposes only.
 * Replace with actual API calls when backend is ready.
 * All data here is fictional and does not represent any real government information.
 */

// Civic service categories
export const CIVIC_SERVICES = [
  {
    id: 'water-supply',
    name: 'Water Supply',
    icon: 'Droplets',
    description: 'Report water supply issues, leakage, contamination, or service disruption',
    complaintCount: 142,
  },
  {
    id: 'roads-transport',
    name: 'Roads & Transport',
    icon: 'Route',
    description: 'Report potholes, damaged roads, traffic signal issues, or transport problems',
    complaintCount: 238,
  },
  {
    id: 'electricity',
    name: 'Electricity',
    icon: 'Zap',
    description: 'Report power outages, faulty streetlights, or electrical hazards',
    complaintCount: 189,
  },
  {
    id: 'waste-management',
    name: 'Waste Management',
    icon: 'Trash2',
    description: 'Report garbage collection issues, illegal dumping, or sanitation problems',
    complaintCount: 176,
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    icon: 'HeartPulse',
    description: 'Report public health concerns, hospital issues, or medical emergencies',
    complaintCount: 95,
  },
  {
    id: 'environment',
    name: 'Environment',
    icon: 'TreePine',
    description: 'Report pollution, deforestation, noise issues, or environmental hazards',
    complaintCount: 67,
  },
  {
    id: 'traffic',
    name: 'Traffic',
    icon: 'TrafficCone',
    description: 'Report traffic congestion, signal malfunctions, or road safety issues',
    complaintCount: 103,
  },
  {
    id: 'public-safety',
    name: 'Public Safety',
    icon: 'ShieldCheck',
    description: 'Report safety hazards, broken infrastructure, or security concerns',
    complaintCount: 124,
  },
  {
    id: 'other',
    name: 'Other Civic Issues',
    icon: 'MoreHorizontal',
    description: 'Report any other civic issue not covered above',
    complaintCount: 53,
  },
];

// Mock complaints for "My Complaints" page
export const MOCK_COMPLAINTS = [
  {
    id: 'GV-2026-000124',
    title: 'Large pothole on MG Road near Central Mall',
    category: 'Roads & Transport',
    status: 'in-progress',
    priority: 'high',
    ward: 'Ward 5',
    dateSubmitted: '2026-09-28',
    lastUpdated: '2026-10-02',
    description: 'There is a large pothole approximately 2 feet wide on MG Road near Central Mall. It is causing significant traffic disruption and is dangerous for two-wheeler riders, especially during evening hours.',
    location: 'MG Road, near Central Mall, Ward 5',
    department: 'Public Works Department',
    aiSeverity: 'High',
    aiCategory: 'Road Damage – Pothole',
    media: [
      { name: 'pothole_mg_road.jpg', size: '2.4 MB', type: 'image' },
      { name: 'road_damage_closeup.jpg', size: '1.8 MB', type: 'image' },
    ],
    departmentUpdate: 'Inspection completed. Repair work has been scheduled for 3rd October. Materials have been procured and the crew has been assigned.',
    citizenFeedback: null,
    timeline: [
      { date: '2026-09-28', status: 'submitted', note: 'Complaint submitted by citizen' },
      { date: '2026-09-28', status: 'ai-analyzed', note: 'AI classified as High priority – Road Damage' },
      { date: '2026-09-29', status: 'assigned', note: 'Assigned to Public Works Department, Ward 5' },
      { date: '2026-10-01', status: 'in-progress', note: 'Repair work scheduled for 3rd October' },
    ],
  },
  {
    id: 'GV-2026-000098',
    title: 'Streetlight not working on Nehru Nagar Lane 3',
    category: 'Electricity',
    status: 'resolved',
    priority: 'medium',
    ward: 'Ward 8',
    dateSubmitted: '2026-09-20',
    lastUpdated: '2026-09-25',
    description: 'The streetlight at the corner of Nehru Nagar Lane 3 has been non-functional for over a week. The area becomes very dark at night, creating safety concerns for residents.',
    location: 'Nehru Nagar Lane 3, Ward 8',
    department: 'Electrical Department',
    aiSeverity: 'Medium',
    aiCategory: 'Streetlight – Non-functional',
    media: [
      { name: 'dark_street.jpg', size: '1.1 MB', type: 'image' },
    ],
    departmentUpdate: 'Streetlight has been repaired and tested successfully. A new LED bulb has been installed. Please confirm if the issue is resolved.',
    citizenFeedback: 'Streetlight is working perfectly now. Thank you for the quick resolution.',
    timeline: [
      { date: '2026-09-20', status: 'submitted', note: 'Complaint submitted by citizen' },
      { date: '2026-09-20', status: 'ai-analyzed', note: 'AI classified as Medium priority – Streetlight Issue' },
      { date: '2026-09-21', status: 'assigned', note: 'Assigned to Electrical Department' },
      { date: '2026-09-23', status: 'in-progress', note: 'Technician dispatched' },
      { date: '2026-09-25', status: 'resolved', note: 'Streetlight repaired and tested' },
    ],
  },
  {
    id: 'GV-2026-000131',
    title: 'Garbage not collected for 3 days in Shivaji Nagar',
    category: 'Waste Management',
    status: 'assigned',
    priority: 'high',
    ward: 'Ward 3',
    dateSubmitted: '2026-10-01',
    lastUpdated: '2026-10-02',
    description: 'Garbage collection has not happened in Shivaji Nagar, Sector B for the past 3 days. Waste is piling up near the community bin and creating hygiene issues.',
    location: 'Shivaji Nagar, Sector B, Ward 3',
    department: 'Sanitation Department',
    aiSeverity: 'High',
    aiCategory: 'Waste – Collection Delay',
    media: [],
    departmentUpdate: 'Issue has been acknowledged. A special collection drive has been scheduled for Ward 3.',
    citizenFeedback: null,
    timeline: [
      { date: '2026-10-01', status: 'submitted', note: 'Complaint submitted by citizen' },
      { date: '2026-10-01', status: 'ai-analyzed', note: 'AI classified as High priority – Waste Collection' },
      { date: '2026-10-02', status: 'assigned', note: 'Assigned to Sanitation Department, Ward 3' },
    ],
  },
  {
    id: 'GV-2026-000145',
    title: 'Water supply disruption in Laxmi Colony',
    category: 'Water Supply',
    status: 'submitted',
    priority: 'critical',
    ward: 'Ward 12',
    dateSubmitted: '2026-10-03',
    lastUpdated: '2026-10-03',
    description: 'No water supply since yesterday morning in Laxmi Colony, Block A and B. Over 200 families are affected. This is an urgent issue.',
    location: 'Laxmi Colony, Block A & B, Ward 12',
    department: 'Water Supply Department',
    aiSeverity: 'Critical',
    aiCategory: 'Water – Supply Disruption',
    media: [
      { name: 'dry_tap.jpg', size: '0.9 MB', type: 'image' },
    ],
    departmentUpdate: null,
    citizenFeedback: null,
    timeline: [
      { date: '2026-10-03', status: 'submitted', note: 'Complaint submitted by citizen' },
      { date: '2026-10-03', status: 'ai-analyzed', note: 'AI classified as Critical – Water Supply Disruption' },
    ],
  },
];

// Mock civic updates (demo data - not real government notices)
export const MOCK_CIVIC_UPDATES = [
  {
    id: 1,
    title: 'Scheduled water supply maintenance in Ward 12',
    category: 'Water Supply',
    date: '2026-10-03',
    description: 'Water supply will be temporarily interrupted in Ward 12 on 5th October from 10:00 AM to 4:00 PM for pipeline maintenance work.',
    severity: 'info',
  },
  {
    id: 2,
    title: 'Road repair work completed in Sector 5',
    category: 'Roads & Transport',
    date: '2026-10-02',
    description: 'Major road repair work on the Sector 5 main road has been completed. All lanes are now open for traffic.',
    severity: 'success',
  },
  {
    id: 3,
    title: 'Streetlight maintenance drive in Ward 8',
    category: 'Electricity',
    date: '2026-10-01',
    description: 'A comprehensive streetlight repair drive is underway in Ward 8. Over 45 non-functional streetlights have been identified for repair.',
    severity: 'info',
  },
  {
    id: 4,
    title: 'Updated waste collection schedule for Ward 3',
    category: 'Waste Management',
    date: '2026-09-30',
    description: 'New waste collection timings for Ward 3: Dry waste – Monday, Wednesday, Friday. Wet waste – Daily. Please segregate waste before collection.',
    severity: 'info',
  },
];

// Mock user profile
export const MOCK_USER = {
  name: 'Rajesh Kumar',
  email: 'rajesh.kumar@example.com',
  phone: '+91 98765 43210',
  ward: 'Ward 5',
  address: '42, MG Road, Sector 3',
  city: 'Sample City',
  preferredLanguage: 'English',
  totalComplaints: 4,
  resolvedComplaints: 1,
  memberSince: '2026-08-15',
};

// Status configuration
export const STATUS_CONFIG = {
  submitted: {
    label: 'Submitted',
    color: 'bg-blue-100 text-navy',
    dotColor: 'bg-navy',
  },
  'ai-analyzed': {
    label: 'AI Analyzed',
    color: 'bg-blue-100 text-navy',
    dotColor: 'bg-navy-light',
  },
  assigned: {
    label: 'Assigned',
    color: 'bg-amber-50 text-amber-700',
    dotColor: 'bg-warning',
  },
  'in-progress': {
    label: 'In Progress',
    color: 'bg-saffron/10 text-amber-700',
    dotColor: 'bg-saffron',
  },
  resolved: {
    label: 'Resolved',
    color: 'bg-green-50 text-green-700',
    dotColor: 'bg-success',
  },
  closed: {
    label: 'Closed',
    color: 'bg-gray-100 text-gray-600',
    dotColor: 'bg-gray-400',
  },
};

// Priority configuration
export const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'bg-green-50 text-green-700' },
  medium: { label: 'Medium', color: 'bg-blue-50 text-blue-700' },
  high: { label: 'High', color: 'bg-amber-50 text-amber-700' },
  critical: { label: 'Critical', color: 'bg-red-50 text-critical' },
};

// FAQ data for Help page
export const FAQ_DATA = [
  {
    question: 'How do I report a complaint?',
    answer: 'Click on "Report a Complaint" from the navigation menu or the home page. Follow the guided multi-step form: fill in the issue details, set the location, upload any relevant photos, review your submission, and submit. You will receive a unique complaint ID for tracking.',
  },
  {
    question: 'How do I track my complaint?',
    answer: 'You can track your complaint in two ways: (1) Go to "My Complaints" to see all your submitted complaints and their current status. (2) Use "Track Complaint" and enter your complaint ID (e.g. GV-2026-000124) to check the status of a specific complaint.',
  },
  {
    question: 'What happens after submission?',
    answer: 'After you submit a complaint, our AI system automatically analyzes the description and any attached images to determine the severity level, appropriate department, and priority. The complaint is then routed to the relevant civic department for action. You will receive status updates as the complaint progresses.',
  },
  {
    question: 'Can I upload photos?',
    answer: 'Yes. During the complaint submission process (Step 3: Media), you can upload images or use your device camera to take a photo of the issue. Attaching photos helps departments understand and verify the issue faster. Supported formats are JPG and PNG, up to 5MB per file.',
  },
  {
    question: 'How does GovMind AI process complaints?',
    answer: 'GovMind AI uses a multi-agent AI system to process complaints. When a complaint is submitted, AI agents analyze the text and images to classify the issue, determine severity, identify the correct department, and set a priority level. This automated triage ensures complaints are routed quickly and efficiently.',
  },
  {
    question: 'How can I provide feedback?',
    answer: 'Once your complaint is resolved, you can provide feedback through the Complaint Details page. Your feedback helps us improve service quality and hold departments accountable for timely resolution.',
  },
  {
    question: 'What are the different complaint statuses?',
    answer: 'Submitted – Your complaint has been received. AI Analyzed – The AI has processed and classified your complaint. Assigned – Your complaint has been assigned to the relevant department. In Progress – The department is actively working on your complaint. Resolved – The issue has been fixed. Closed – The complaint has been closed after resolution.',
  },
  {
    question: 'Is this an official government website?',
    answer: 'No. GovMind AI is a college project demonstrating how AI can be used to improve civic governance. It is not affiliated with any official government body. All data shown is for demonstration purposes only.',
  },
];

/**
 * Mock complaint ID generator.
 * Replace this with actual backend ID generation when API is ready.
 */
export function generateComplaintId() {
  const num = String(Math.floor(Math.random() * 999999)).padStart(6, '0');
  return `GV-2026-${num}`;
}
