import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, AlertCircle, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MOCK_COMPLAINTS, STATUS_CONFIG } from '../data/mockData';
import StatusBadge from '../components/ui/StatusBadge';
import PriorityBadge from '../components/ui/PriorityBadge';

export default function TrackComplaint() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const [result, setResult] = useState(null);

  const handleSearch = (e) => {
    e.preventDefault();
    const found = MOCK_COMPLAINTS.find(
      (c) => c.id.toLowerCase() === query.trim().toLowerCase()
    );
    setResult(found || null);
    setSearched(true);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-navy mb-1">{t('track.pageTitle')}</h1>
        <p className="text-text-secondary">{t('track.pageSubtitle')}</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder={t('track.placeholder')}
            className="w-full border border-border rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy" />
        </div>
        <button type="submit" className="bg-navy text-white font-medium px-5 py-3 rounded-lg hover:bg-navy-dark transition-colors shrink-0">
          {t('track.trackBtn')}
        </button>
      </form>

      {/* Demo hint */}
      {!searched && (
        <div className="bg-white border border-border rounded-lg p-4 text-center">
          <p className="text-text-secondary text-sm mb-2">{t('track.demoHint')}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {MOCK_COMPLAINTS.map((c) => (
              <button key={c.id} onClick={() => setQuery(c.id)}
                className="text-xs font-mono text-navy bg-navy/5 px-2 py-1 rounded hover:bg-navy/10 transition-colors">
                {c.id}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Not found */}
      {searched && !result && (
        <div className="bg-white border border-border rounded-lg p-8 text-center">
          <AlertCircle size={40} className="mx-auto text-critical mb-3" />
          <h3 className="font-semibold text-text-primary mb-1">{t('track.notFoundTitle')}</h3>
          <p className="text-text-secondary text-sm">
            {t('track.notFoundDesc', { id: query })}
          </p>
        </div>
      )}

      {/* Result */}
      {searched && result && (
        <div className="space-y-6">
          {/* Summary card */}
          <div className="bg-white border border-border rounded-lg p-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
              <div>
                <span className="text-xs font-mono font-semibold text-navy">{result.id}</span>
                <h3 className="font-semibold text-text-primary mt-1">{result.title}</h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={result.status} size="md" />
                <PriorityBadge priority={result.priority} size="md" />
              </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-secondary mb-4">
              <span>{t('track.category')}: <span className="font-medium text-text-primary">{result.category}</span></span>
              <span>{t('track.ward')}: <span className="font-medium text-text-primary">{result.ward}</span></span>
              <span>{t('track.department')}: <span className="font-medium text-text-primary">{result.department}</span></span>
            </div>
            <Link to={`/complaint/${result.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-navy hover:text-saffron transition-colors">
              {t('track.viewFullDetails')} <ArrowRight size={14} />
            </Link>
          </div>

          {/* Timeline */}
          <div className="bg-white border border-border rounded-lg p-5">
            <h3 className="font-semibold text-navy mb-4">{t('track.timelineTitle')}</h3>
            <div className="relative">
              <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />
              <div className="space-y-5">
                {result.timeline.map((event, i) => {
                  const isLast = i === result.timeline.length - 1;
                  const isResolved = event.status === 'resolved';
                  const config = STATUS_CONFIG[event.status];
                  return (
                    <div key={i} className="flex gap-4 relative">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 z-10 ${isResolved ? 'bg-success border-success' : isLast ? 'bg-saffron border-saffron' : 'bg-white border-border'}`}>
                        <div className={`w-2 h-2 rounded-full ${isResolved || isLast ? 'bg-white' : 'bg-border'}`} />
                      </div>
                      <div className="pb-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium text-text-primary">{config?.label || event.status}</span>
                          <span className="text-xs text-text-secondary">{event.date}</span>
                        </div>
                        <p className="text-sm text-text-secondary">{event.note}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
