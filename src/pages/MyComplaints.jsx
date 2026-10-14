import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, FileX, Calendar, MapPin, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MOCK_COMPLAINTS, CIVIC_SERVICES } from '../data/mockData';
import StatusBadge from '../components/ui/StatusBadge';
import PriorityBadge from '../components/ui/PriorityBadge';

const STATUS_VALUES = ['all', 'submitted', 'assigned', 'in-progress', 'resolved'];

export default function MyComplaints() {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    return MOCK_COMPLAINTS.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!c.title.toLowerCase().includes(q) && !c.id.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [statusFilter, categoryFilter, searchQuery]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy mb-1">{t('myComplaints.pageTitle')}</h1>
        <p className="text-text-secondary">{t('myComplaints.pageSubtitle')}</p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-border rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Status filter */}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 bg-white">
            {STATUS_VALUES.map((s) => (
              <option key={s} value={s}>
                {t(`myComplaints.statuses.${s === 'in-progress' ? 'in-progress' : s}`,
                  { defaultValue: s === 'all' ? t('myComplaints.allStatuses') : s })}
              </option>
            ))}
          </select>

          {/* Category filter */}
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 bg-white">
            <option value="all">{t('myComplaints.allCategories')}</option>
            {CIVIC_SERVICES.map((s) => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>

          {/* Search */}
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('myComplaints.searchPlaceholder')}
              className="w-full border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" />
          </div>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-border rounded-lg p-12 text-center">
          <FileX size={40} className="mx-auto text-text-secondary mb-3" />
          <h3 className="font-semibold text-text-primary mb-1">{t('myComplaints.noComplaintsTitle')}</h3>
          <p className="text-text-secondary text-sm">{t('myComplaints.noComplaintsDesc')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((c) => (
            <div key={c.id} className="bg-white border border-border rounded-lg p-5 hover:shadow-sm transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                <div>
                  <span className="text-xs font-mono font-semibold text-navy">{c.id}</span>
                  <h3 className="font-semibold text-text-primary mt-1">{c.title}</h3>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={c.status} />
                  <PriorityBadge priority={c.priority} />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary mb-3">
                <span className="bg-navy/5 text-navy px-2 py-0.5 rounded font-medium">{c.category}</span>
                <span className="flex items-center gap-1"><MapPin size={12} /> {c.ward}</span>
                <span className="flex items-center gap-1"><Calendar size={12} /> {t('myComplaints.submittedLabel')} {c.dateSubmitted}</span>
                <span className="flex items-center gap-1"><Calendar size={12} /> {t('myComplaints.updatedLabel')} {c.lastUpdated}</span>
              </div>
              <Link to={`/complaint/${c.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-navy hover:text-saffron transition-colors">
                {t('myComplaints.viewDetails')} <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
