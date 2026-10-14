import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle, Search, ChevronDown, ChevronUp,
  Mail, Phone, MapPin, ArrowRight, FileText, Brain,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FAQ_DATA } from '../data/mockData';

export default function Help() {
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const CONTACT_CARDS = [
    { icon: Mail,   titleKey: 'help.contactCards.emailTitle',  value: 'support@govmind.ai',        noteKey: 'help.contactCards.emailNote' },
    { icon: Phone,  titleKey: 'help.contactCards.phoneTitle',  value: '1800-XXX-XXXX (Demo)',      noteKey: 'help.contactCards.phoneNote' },
    { icon: MapPin, titleKey: 'help.contactCards.officeTitle', value: 'Demo City Municipal Corp',  noteKey: 'help.contactCards.officeNote' },
  ];

  const QUICK_LINKS = [
    { labelKey: 'help.quickLinks.reportComplaint', to: '/report',  icon: FileText },
    { labelKey: 'help.quickLinks.trackStatus',     to: '/track',   icon: Search   },
    { labelKey: 'help.quickLinks.aiAnalysis',      to: '/',        icon: Brain    },
    { labelKey: 'help.quickLinks.priorityLevels',  to: '/',        icon: HelpCircle },
  ];

  const filteredFaqs = searchQuery
    ? FAQ_DATA.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : FAQ_DATA;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded-full bg-navy/10 flex items-center justify-center">
            <HelpCircle size={24} className="text-navy" />
          </div>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-navy mb-2">{t('help.pageTitle')}</h1>
        <p className="text-text-secondary">{t('help.pageSubtitle')}</p>
      </div>

      {/* Search */}
      <div className="relative max-w-lg mx-auto mb-10">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('help.searchPlaceholder')}
          className="w-full border border-border rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy" />
      </div>

      {/* FAQ */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-navy mb-4">{t('help.faqTitle')}</h2>
        <div className="space-y-3">
          {filteredFaqs.length === 0 && (
            <p className="text-text-secondary text-sm text-center py-6">{t('help.noResults')}</p>
          )}
          {filteredFaqs.map((faq, i) => {
            const isOpen = openFaq === i;
            return (
              <div key={i} className="bg-white border border-border rounded-lg overflow-hidden">
                <button onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-page-bg/50 transition-colors"
                  aria-expanded={isOpen}>
                  <span className="font-medium text-text-primary text-sm pr-4">{faq.question}</span>
                  {isOpen
                    ? <ChevronUp size={18} className="text-text-secondary shrink-0" />
                    : <ChevronDown size={18} className="text-text-secondary shrink-0" />}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 border-t border-border">
                    <p className="text-text-secondary text-sm pt-3 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Contact */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-navy mb-4">{t('help.contactTitle')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {CONTACT_CARDS.map((card) => (
            <div key={card.titleKey} className="bg-white border border-border rounded-lg p-5 text-center">
              <div className="w-10 h-10 rounded-full bg-navy/5 flex items-center justify-center mx-auto mb-3">
                <card.icon size={18} className="text-navy" />
              </div>
              <h3 className="font-semibold text-text-primary text-sm mb-1">{t(card.titleKey)}</h3>
              <p className="text-navy text-sm font-medium mb-1">{card.value}</p>
              <p className="text-text-secondary text-xs">{t(card.noteKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick links */}
      <section>
        <h2 className="text-xl font-bold text-navy mb-4">{t('help.quickLinksTitle')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {QUICK_LINKS.map((link) => (
            <Link key={link.labelKey} to={link.to}
              className="flex items-center justify-between bg-white border border-border rounded-lg p-4 hover:bg-page-bg transition-colors group">
              <div className="flex items-center gap-2.5">
                <link.icon size={16} className="text-navy" />
                <span className="text-sm font-medium text-text-primary">{t(link.labelKey)}</span>
              </div>
              <ArrowRight size={14} className="text-text-secondary group-hover:text-navy transition-colors" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
