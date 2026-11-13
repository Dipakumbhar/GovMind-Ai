const crypto = require('crypto');

const EARTH_RADIUS_METERS = 6371000;
const CLUSTER_RADIUS_METERS = 500;
const MIN_CLUSTER_SIZE = 2;
const PRIORITY_BASE = { critical: 90, high: 75, medium: 50, low: 25 };

function complaintCoordinates(complaint) {
  const location = complaint.location && typeof complaint.location === 'object'
    ? complaint.location
    : {};
  const lat = Number(location.lat ?? complaint.lat ?? complaint.coordinates?.lat);
  const lng = Number(location.lng ?? complaint.lng ?? complaint.coordinates?.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
    ? { lat, lng }
    : null;
}

function distanceMeters(a, b) {
  const radians = (value) => (value * Math.PI) / 180;
  const dLat = radians(b.lat - a.lat);
  const dLng = radians(b.lng - a.lng);
  const lat1 = radians(a.lat);
  const lat2 = radians(b.lat);
  const haversine = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function normalizedSeverity(complaint) {
  const candidates = [complaint.aiSeverity, complaint.severity, complaint.priority]
    .map((value) => String(value || '').trim().toLowerCase());
  return candidates.find((value) => Object.prototype.hasOwnProperty.call(PRIORITY_BASE, value)) || '';
}

function severityBand(score) {
  if (score >= 80) return 'Critical';
  if (score >= 60) return 'High';
  if (score >= 35) return 'Medium';
  return 'Low';
}

function dbscan(points) {
  const visited = new Set();
  const assigned = new Set();
  const clusters = [];
  const neighborsOf = (index) => points
    .map((point, otherIndex) => distanceMeters(points[index].coordinates, point.coordinates) <= CLUSTER_RADIUS_METERS ? otherIndex : -1)
    .filter((otherIndex) => otherIndex >= 0);

  for (let index = 0; index < points.length; index += 1) {
    if (visited.has(index)) continue;
    visited.add(index);
    const neighbors = neighborsOf(index);
    if (neighbors.length < MIN_CLUSTER_SIZE) continue;

    const members = new Set([index]);
    const queue = [...neighbors];
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const neighbor = queue[cursor];
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        const expanded = neighborsOf(neighbor);
        if (expanded.length >= MIN_CLUSTER_SIZE) {
          expanded.forEach((candidate) => {
            if (!queue.includes(candidate)) queue.push(candidate);
          });
        }
      }
      if (!assigned.has(neighbor)) members.add(neighbor);
    }
    members.forEach((member) => assigned.add(member));
    if (members.size >= MIN_CLUSTER_SIZE) clusters.push([...members].map((member) => points[member]));
  }
  return clusters;
}

function analyzeComplaints(input) {
  const complaints = Array.isArray(input) ? input : [];
  const points = complaints
    .map((complaint) => ({ complaint, coordinates: complaintCoordinates(complaint) }))
    .filter((point) => point.coordinates);

  const scores = new Map();
  complaints.forEach((complaint) => {
    const coordinates = complaintCoordinates(complaint);
    const priority = normalizedSeverity(complaint);
    const base = PRIORITY_BASE[priority];
    const localCount = coordinates
      ? points.filter((point) => distanceMeters(coordinates, point.coordinates) <= CLUSTER_RADIUS_METERS).length
      : 1;
    const nearbyReports = Math.max(0, localCount - 1);
    const storedRisk = Number.isFinite(complaint.civicRiskScore) ? complaint.civicRiskScore : null;
    const storedImpact = Number.isFinite(complaint.civicImpactScore) ? complaint.civicImpactScore : null;
    const risk = storedRisk ?? (base === undefined ? null : Math.min(100, Math.round(base + Math.min(20, nearbyReports * 10))));
    const impact = storedImpact ?? (base === undefined ? null : Math.min(100, Math.round(base + Math.min(20, nearbyReports * 5))));
    scores.set(String(complaint.complaintId || complaint._id), {
      id: String(complaint.complaintId || complaint._id),
      civicRiskScore: risk,
      civicImpactScore: impact,
      riskScoreMethod: storedRisk !== null
        ? 'Stored complaint score'
        : (base === undefined ? null : 'Rule-based screening index'),
      impactScoreMethod: storedImpact !== null
        ? 'Stored complaint score'
        : (base === undefined ? null : 'Rule-based impact proxy'),
      scoreMethod: storedRisk !== null && storedImpact !== null
        ? 'Stored complaint scores'
        : storedRisk !== null || storedImpact !== null
          ? 'Stored + Rule-Based'
          : (base === undefined ? null : 'Rule-based screening index'),
      nearbyReports,
    });
  });

  const clusters = dbscan(points).map((group) => {
    const docs = group.map((point) => point.complaint);
    const ids = docs.map((doc) => String(doc.complaintId || doc._id)).sort();
    const id = `GEO-${crypto.createHash('sha1').update(ids.join('|')).digest('hex').slice(0, 8).toUpperCase()}`;
    const lat = group.reduce((sum, point) => sum + point.coordinates.lat, 0) / group.length;
    const lng = group.reduce((sum, point) => sum + point.coordinates.lng, 0) / group.length;
    const wards = [...new Set(docs.map((doc) => doc.location?.ward || doc.ward).filter(Boolean))];
    const addresses = [...new Set(docs.map((doc) => doc.location?.address).filter(Boolean))];
    const categoryCounts = new Map();
    docs.forEach((doc) => categoryCounts.set(doc.category, (categoryCounts.get(doc.category) || 0) + 1));
    const category = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    const riskValues = docs.map((doc) => scores.get(String(doc.complaintId || doc._id))?.civicRiskScore).filter(Number.isFinite);
    const impactValues = docs.map((doc) => scores.get(String(doc.complaintId || doc._id))?.civicImpactScore).filter(Number.isFinite);
    const mean = (values) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
    const dates = docs.map((doc) => new Date(doc.createdAt || doc.dateSubmitted || doc.reportedDate)).filter((date) => Number.isFinite(date.getTime()));
    const statuses = docs.map((doc) => String(doc.status || '').toLowerCase());
    const active = statuses.some((status) => !['resolved', 'closed', 'rejected'].includes(status));

    return {
      id,
      title: `Geographic group · ${docs.length} reports`,
      location: addresses.length === 1 ? addresses[0] : `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      coordinates: { lat, lng },
      ward: wards.length === 1 ? wards[0] : (wards.length > 1 ? 'Multiple' : ''),
      complaintIds: ids,
      firstReported: dates.length ? new Date(Math.min(...dates)).toISOString().slice(0, 10) : '',
      latestReport: dates.length ? new Date(Math.max(...dates)).toISOString().slice(0, 10) : '',
      avgSeverity: mean(riskValues) === null ? 'Unknown' : severityBand(mean(riskValues)),
      civicRiskScore: mean(riskValues),
      civicImpactScore: mean(impactValues),
      clusterConfidence: null,
      status: active ? 'Active' : 'Resolved',
      description: `Complaints within ${CLUSTER_RADIUS_METERS} m using DBSCAN (minimum ${MIN_CLUSTER_SIZE} reports). No cause or AI confidence is inferred.`,
      rootCause: 'Not inferred from complaint records.',
      recommendedAction: 'Review the grouped complaint records.',
      observedCategory: category,
      complaintCount: docs.length,
      avgRiskScore: mean(riskValues),
      avgImpactScore: mean(impactValues),
      recurrenceFrequency: docs.length > 3 ? 'High' : 'Observed',
      severity: mean(riskValues) === null ? 'Unknown' : severityBand(mean(riskValues)),
      name: addresses.length === 1 ? addresses[0] : `Geographic group ${id}`,
      relatedComplaints: ids,
    };
  });

  return {
    methodology: {
      clustering: `DBSCAN on stored latitude/longitude, ${CLUSTER_RADIUS_METERS} m radius, ${MIN_CLUSTER_SIZE} report minimum.`,
    scoring: 'Stored risk and impact scores are retained. Missing risk scores use the stored priority baseline (critical 90, high 75, medium 50, low 25) plus up to 20 points (10 per additional complaint within 500 m). Missing impact scores use the same baseline plus up to 20 points (5 per nearby complaint); this is a priority-and-density proxy, not measured population impact or an ML prediction. Scores are not persisted to complaint documents.',
    },
    locatedComplaints: points.length,
    unlocatedComplaints: complaints.length - points.length,
    complaintScores: [...scores.values()],
    clusters,
    hotspots: clusters.map((cluster) => ({
      id: cluster.id,
      name: cluster.name,
      ward: cluster.ward,
      complaintCount: cluster.complaintCount,
      avgRiskScore: cluster.avgRiskScore,
      avgImpactScore: cluster.avgImpactScore,
      recurrenceFrequency: cluster.recurrenceFrequency,
      observedCategory: cluster.observedCategory,
      coordinates: cluster.coordinates,
      severity: cluster.severity,
      suggestedAction: 'Review the geographically grouped complaints.',
      relatedComplaints: cluster.relatedComplaints,
    })),
  };
}

module.exports = { analyzeComplaints, complaintCoordinates, distanceMeters };
