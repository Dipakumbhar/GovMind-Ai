import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Droplets, Route, Zap, Trash2, HeartPulse,
  TreePine, ShieldCheck, MoreHorizontal, TrafficCone,
} from 'lucide-react';

const ICON_MAP = {
  Droplets, Route, Zap, Trash2, HeartPulse,
  TreePine, ShieldCheck, MoreHorizontal, TrafficCone,
};

// Map service ID → translation key prefix
const SERVICE_KEY_MAP = {
  'water-supply':    'waterSupply',
  'roads-transport': 'roadsTransport',
  'electricity':     'electricity',
  'waste-management':'wasteManagement',
  'healthcare':      'healthcare',
  'environment':     'environment',
  'traffic':         'traffic',
  'public-safety':   'publicSafety',
  'other':           'other',
};

export default function ServiceCard({ service }) {
  const { t } = useTranslation();
  const Icon = ICON_MAP[service.icon] || MoreHorizontal;
  const keyBase = SERVICE_KEY_MAP[service.id];

  const name = keyBase ? t(`services.${keyBase}`) : service.name;
  const desc = keyBase ? t(`services.${keyBase}Desc`) : service.description;

  return (
    <div className="group bg-white border border-border rounded-xl p-5 hover:shadow-md hover:border-saffron/40 transition-all flex flex-col h-full">
      <div className="flex items-start gap-3 flex-1">
        <div className="p-2.5 rounded-lg bg-navy/5 text-navy group-hover:bg-saffron/10 group-hover:text-saffron transition-colors shrink-0" aria-hidden="true">
          <Icon size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-navy text-sm leading-snug">{name}</h3>
          <p className="text-text-secondary text-xs mt-1 leading-relaxed line-clamp-3">{desc}</p>
          <span className="inline-block mt-2 text-xs text-text-secondary bg-page-bg px-2 py-0.5 rounded-full">
            {service.complaintCount} {t('services.complaints')}
          </span>
        </div>
      </div>
      <Link
        to={`/report?category=${service.id}`}
        className="mt-4 flex items-center justify-center gap-1.5 bg-navy/5 text-navy text-xs font-semibold py-2.5 rounded-lg hover:bg-navy hover:text-white focus-visible:bg-navy focus-visible:text-white transition-colors"
        aria-label={t('services.reportIssueAriaLabel', { name })}
      >
        {t('services.reportIssue')} <ArrowRight size={13} aria-hidden="true" />
      </Link>
    </div>
  );
}
