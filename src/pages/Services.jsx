import { Link } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CIVIC_SERVICES } from '../data/mockData';
import ServiceCard from '../components/ui/ServiceCard';

export default function Services() {
  const { t } = useTranslation();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="text-center mb-10">
        <h1 className="text-2xl md:text-3xl font-bold text-navy mb-2">{t('services.pageTitle')}</h1>
        <p className="text-text-secondary">{t('services.pageSubtitle')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {CIVIC_SERVICES.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>

      <div className="max-w-xl mx-auto bg-white border border-border rounded-lg p-6 text-center">
        <HelpCircle size={28} className="mx-auto text-navy mb-3" />
        <h3 className="font-semibold text-text-primary mb-1">{t('services.cantFind')}</h3>
        <p className="text-text-secondary text-sm mb-4">{t('services.cantFindDesc')}</p>
        <Link to="/help" className="inline-flex items-center gap-1 text-sm font-medium text-navy hover:text-saffron transition-colors">
          {t('services.visitHelp')}
        </Link>
      </div>
    </div>
  );
}
