import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Calendar, Building2, Brain, Clock,
  ChevronRight, Home, AlertTriangle, Image as ImageIcon,
  MessageSquare, Star, Loader2, ExternalLink,
} from 'lucide-react';
import { STATUS_CONFIG } from '../data/mockData';
import StatusBadge from '../components/ui/StatusBadge';
import PriorityBadge from '../components/ui/PriorityBadge';

export default function ComplaintDetails() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [lightbox,  setLightbox]  = useState(null); // URL of enlarged photo

  useEffect(() => {
    let cancelled = false;
    async function fetchComplaint() {
      setLoading(true);
      setError('');
      try {
        const res  = await fetch(`/api/complaints/${encodeURIComponent(id)}`, {
          credentials: 'include',
        });
        const data = await res.json();
        if (!cancelled) {
          if (res.ok) {
            setComplaint(data.complaint);
          } else {
            setError(data.message || 'Complaint not found.');
          }
        }
      } catch {
        if (!cancelled) setError('Network error. Please check your connection.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchComplaint();
    return () => { cancelled = true; };
  }, [id]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <Loader2 size={40} className="mx-auto text-navy animate-spin mb-4" />
        <p className="text-text-secondary">Loading complaint…</p>
      </div>
    );
  }

  // ── Error / Not found ───────────────────────────────────────────────────
  if (error || !complaint) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <AlertTriangle size={48} className="mx-auto text-warning mb-4" />
        <h2 className="text-xl font-bold text-navy mb-2">Complaint Not Found</h2>
        <p className="text-text-secondary mb-6">{error || 'This complaint could not be loaded.'}</p>
        <Link
          to="/my-complaints"
          className="inline-flex items-center gap-2 bg-navy text-white font-medium px-5 py-2.5 rounded-lg hover:bg-navy-dark transition-colors"
        >
          <ArrowLeft size={16} /> Back to My Complaints
        </Link>
      </div>
    );
  }

  const c = complaint;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt="Enlarged complaint photo"
            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl font-light"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-text-secondary mb-6 flex-wrap">
        <Link to="/" className="hover:text-navy flex items-center gap-1">
          <Home size={14} /> Home
        </Link>
        <ChevronRight size={14} />
        <Link to="/my-complaints" className="hover:text-navy">My Complaints</Link>
        <ChevronRight size={14} />
        <span className="text-navy font-medium">{c.complaintId}</span>
      </nav>

      {/* ── Header card ── */}
      <div className="bg-white border border-border rounded-lg p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div>
            <span className="text-sm font-mono font-bold text-navy">{c.complaintId}</span>
            <h1 className="text-xl font-bold text-text-primary mt-1">{c.title}</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={c.status} size="md" />
            <PriorityBadge priority={c.priority} size="md" />
          </div>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-text-secondary">
          <span className="bg-navy/5 text-navy px-2.5 py-0.5 rounded font-medium">{c.category}</span>
          <span className="flex items-center gap-1.5">
            <Building2 size={14} /> {c.department}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Complaint Information */}
          <div className="bg-white border border-border rounded-lg p-6">
            <h2 className="font-semibold text-navy mb-3">Complaint Information</h2>
            <p className="text-text-secondary text-sm leading-relaxed">{c.description}</p>
          </div>

          {/* Location */}
          {c.location && (
            <div className="bg-white border border-border rounded-lg p-6">
              <h2 className="font-semibold text-navy mb-4">Location</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {c.location.address && <InfoRow icon={MapPin}  label="Address" value={c.location.address} />}
                {c.location.ward    && <InfoRow icon={MapPin}  label="Ward"    value={c.location.ward} />}
                {c.location.pincode && <InfoRow icon={MapPin}  label="Pincode" value={c.location.pincode} />}
              </div>
            </div>
          )}

          {/* ── Submitted Photos (real Cloudinary images) ── */}
          <div className="bg-white border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon size={18} className="text-navy" />
              <h2 className="font-semibold text-navy">Submitted Photos</h2>
              {c.photos && c.photos.length > 0 && (
                <span className="ml-auto text-xs text-text-secondary">
                  {c.photos.length} photo{c.photos.length > 1 ? 's' : ''} · Click to enlarge
                </span>
              )}
            </div>

            {c.photos && c.photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {c.photos.map((photo, i) => (
                  <div
                    key={i}
                    className="border border-border rounded-lg overflow-hidden cursor-pointer group hover:border-navy/30 transition-colors"
                    onClick={() => setLightbox(photo.url)}
                  >
                    <div className="aspect-square bg-page-bg relative">
                      <img
                        src={photo.url}
                        alt={`Complaint photo ${i + 1}`}
                        className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                        loading="lazy"
                      />
                      {/* Enlarge hint overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <ExternalLink size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                      </div>
                    </div>
                    <div className="p-2 border-t border-border flex items-center justify-between">
                      <p className="text-xs text-text-secondary">Photo {i + 1}</p>
                      <a
                        href={photo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-navy hover:text-saffron"
                        title="Open original"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-secondary">No photos attached to this complaint.</p>
            )}
          </div>

          {/* Details grid */}
          <div className="bg-white border border-border rounded-lg p-6">
            <h2 className="font-semibold text-navy mb-4">Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow icon={Calendar}  label="Date Submitted" value={new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />
              <InfoRow icon={Clock}     label="Last Updated"   value={new Date(c.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />
              <InfoRow icon={Building2} label="Department"     value={c.department} />
              {c.location?.ward && <InfoRow icon={MapPin} label="Ward" value={c.location.ward} />}
            </div>
          </div>

          {/* AI Analysis */}
          <div className="bg-white border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain size={18} className="text-navy" />
              <h2 className="font-semibold text-navy">AI Analysis</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-page-bg rounded-lg p-3">
                <p className="text-xs text-text-secondary mb-0.5">Severity Level</p>
                <p className="font-semibold text-text-primary">{c.aiSeverity || 'Pending'}</p>
              </div>
              <div className="bg-page-bg rounded-lg p-3">
                <p className="text-xs text-text-secondary mb-0.5">Category Classification</p>
                <p className="font-semibold text-text-primary">{c.aiCategory || 'Pending'}</p>
              </div>
            </div>
          </div>

          {/* Department Update */}
          <div className="bg-white border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={18} className="text-navy" />
              <h2 className="font-semibold text-navy">Department Update</h2>
            </div>
            {c.departmentUpdate ? (
              <div className="bg-page-bg border border-border rounded-lg p-4">
                <p className="text-sm text-text-primary leading-relaxed">
                  &quot;{c.departmentUpdate}&quot;
                </p>
                <p className="text-xs text-text-secondary mt-2">— {c.department}</p>
              </div>
            ) : (
              <p className="text-sm text-text-secondary">
                No updates from the department yet. Updates will appear here once the department responds.
              </p>
            )}
          </div>

          {/* Citizen Feedback */}
          <div className="bg-white border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={18} className="text-navy" />
              <h2 className="font-semibold text-navy">Citizen Feedback</h2>
            </div>
            {c.citizenFeedback ? (
              <div className="bg-success/5 border border-success/20 rounded-lg p-4">
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={14} className="text-saffron fill-saffron" />
                  ))}
                </div>
                <p className="text-sm text-text-primary leading-relaxed">&quot;{c.citizenFeedback}&quot;</p>
              </div>
            ) : c.status === 'resolved' ? (
              <div>
                <p className="text-sm text-text-secondary mb-3">
                  This complaint has been resolved. Share your feedback to help improve civic services.
                </p>
                <button className="inline-flex items-center gap-1.5 bg-navy text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-navy-dark transition-colors">
                  <MessageSquare size={14} /> Give Feedback
                </button>
              </div>
            ) : (
              <p className="text-sm text-text-secondary">
                Feedback can be provided once the complaint is resolved.
              </p>
            )}
          </div>
        </div>

        {/* ── Right column: Timeline ── */}
        <div>
          <div className="bg-white border border-border rounded-lg p-6 sticky top-20">
            <h2 className="font-semibold text-navy mb-1">Progress Timeline</h2>
            <p className="text-xs text-text-secondary mb-4">
              Current Status: {STATUS_CONFIG[c.status]?.label || c.status}
            </p>
            <div className="relative">
              <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />
              <div className="space-y-5">
                {(c.timeline || []).map((event, i) => {
                  const isLast     = i === c.timeline.length - 1;
                  const isResolved = event.status === 'resolved';
                  const config     = STATUS_CONFIG[event.status];
                  return (
                    <div key={i} className="flex gap-3 relative">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 z-10 ${
                        isResolved ? 'bg-success border-success' :
                        isLast     ? 'bg-saffron border-saffron' :
                                     'bg-white border-border'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${isResolved || isLast ? 'bg-white' : 'bg-border'}`} />
                      </div>
                      <div className="pb-1 min-w-0">
                        <p className="text-xs font-medium text-text-primary">{config?.label || event.status}</p>
                        <p className="text-xs text-text-secondary mt-0.5">{event.note}</p>
                        <p className="text-[11px] text-text-secondary mt-1">{event.date}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Back button */}
      <div className="mt-8">
        <Link
          to="/my-complaints"
          className="inline-flex items-center gap-2 border border-border text-text-secondary font-medium px-5 py-2.5 rounded-lg hover:bg-white transition-colors"
        >
          <ArrowLeft size={16} /> Back to My Complaints
        </Link>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={14} className="text-text-secondary mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-text-secondary">{label}</p>
        <p className="text-sm font-medium text-text-primary">{value}</p>
      </div>
    </div>
  );
}
