import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight, Search, FileText, Brain, Building2, CheckCircle2, Bell,
} from 'lucide-react';
import { CIVIC_SERVICES, MOCK_CIVIC_UPDATES } from '../data/mockData';
import ServiceCard from '../components/ui/ServiceCard';


const SEVERITY_STYLES = {
  info: 'bg-navy',
  success: 'bg-success',
  warning: 'bg-warning',
};

export default function Home() {
  const { t } = useTranslation();

  const STEPS = [

    { num: '01', icon: FileText,     titleKey: 'home.steps.01.title', descKey: 'home.steps.01.desc' },
    { num: '02', icon: Brain,        titleKey: 'home.steps.02.title', descKey: 'home.steps.02.desc' },
    { num: '03', icon: Building2,    titleKey: 'home.steps.03.title', descKey: 'home.steps.03.desc' },
    { num: '04', icon: CheckCircle2, titleKey: 'home.steps.04.title', descKey: 'home.steps.04.desc' },
  ];

  return (
    <>
      {/* ====== COMPACT HERO BANNER ====== */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #EEF4FB 0%, #DDEAF6 60%, #EAF3FF 100%)' }}
      >
        {/* Decorative saffron + green arcs — top-right corner */}
        <svg
          aria-hidden="true"
          className="absolute top-0 right-0 pointer-events-none"
          style={{ width: 200, height: 120, opacity: 0.55 }}
          viewBox="0 0 200 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Saffron arc */}
          <path d="M200 0 Q160 60 60 90" stroke="#FF9933" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.7" />
          <path d="M200 20 Q155 75 65 105" stroke="#FF9933" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.4" />
          {/* Green arc */}
          <path d="M200 40 Q150 88 70 118" stroke="#138808" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5" />
          <path d="M200 58 Q148 100 80 120" stroke="#138808" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.3" />
        </svg>

        {/* Subtle left-side navy accent stripe */}
        <div
          aria-hidden="true"
          className="absolute left-0 top-0 bottom-0 w-1.5 rounded-r"
          style={{ background: 'linear-gradient(to bottom, #FF9933, #0B3A6E, #138808)' }}
        />

        <div className="relative max-w-7xl mx-auto">
          {/* hero-row: flex-col on mobile, flex-row on desktop at 210px height */}
          <div className="hero-row">

            {/* ── Left: text + buttons ── */}
            <div className="flex-1 min-w-0 flex flex-col justify-center pl-6 pr-4 sm:pl-8 lg:pl-10 xl:pl-12 py-6 lg:py-0 z-10">
              {/* Heading */}
              <h1
                className="font-bold text-navy leading-tight mb-2"
                style={{ fontSize: 'clamp(16px, 2.2vw, 26px)' }}
              >
                {t('home.heroHeadingCompact', 'Stronger Communities\nThrough Smarter Governance')}
              </h1>

              {/* Description */}
              <p
                className="text-text-secondary leading-relaxed mb-4"
                style={{ fontSize: 'clamp(11px, 1.1vw, 13px)', maxWidth: '36ch' }}
              >
                {t('home.heroDescCompact', 'Report civic issues, track progress and help build a cleaner, safer and better tomorrow.')}
              </p>

              {/* Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/report"
                  id="hero-report-btn"
                  className="inline-flex items-center gap-1.5 bg-navy text-white font-semibold rounded-md transition-colors hover:bg-navy-dark"
                  style={{ fontSize: 'clamp(10px, 1vw, 12px)', padding: '7px 14px' }}
                >
                  <FileText size={13} aria-hidden="true" />
                  {t('home.reportBtn')}
                </Link>
                <Link
                  to="/track"
                  id="hero-track-btn"
                  className="inline-flex items-center gap-1.5 bg-white text-navy font-semibold rounded-md border border-navy/30 transition-colors hover:bg-navy/5"
                  style={{ fontSize: 'clamp(10px, 1vw, 12px)', padding: '7px 14px' }}
                >
                  <Search size={13} aria-hidden="true" />
                  {t('home.trackBtn')}
                </Link>
              </div>
            </div>

            {/* ── Right: building image ── */}
            <div className="hero-image-col" aria-hidden="true">
              {/* Soft left-edge blend into the light background */}
              <div
                style={{
                  position: 'absolute', top: 0, left: 0, bottom: 0,
                  width: '90px',
                  background: 'linear-gradient(to right, #EEF4FB 0%, rgba(238,244,251,0.6) 50%, transparent 100%)',
                  zIndex: 10, pointerEvents: 'none',
                }}
              />
              {/* Top fade on mobile */}
              <div
                className="lg:hidden"
                style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '40px',
                  background: 'linear-gradient(to bottom, #EEF4FB 0%, transparent 100%)',
                  zIndex: 10, pointerEvents: 'none',
                }}
              />
              <img
                src="/banner.png"
                alt=""
                role="presentation"
              />
            </div>

          </div>
        </div>
      </section>

      {/* ====== HOW IT WORKS ====== */}
      <section className="bg-page-bg py-14 sm:py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-2">{t('home.howTitle')}</h2>
            <p className="text-text-secondary max-w-md mx-auto">{t('home.howSubtitle')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {STEPS.map((step) => (
              <div key={step.num} className="step-card bg-white border border-border rounded-xl p-6 text-center">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-saffron/10 text-saffron text-sm font-bold mb-4" aria-hidden="true">{step.num}</span>
                <div className="flex justify-center mb-3" aria-hidden="true"><step.icon size={32} className="text-navy" /></div>
                <h3 className="font-semibold text-navy mb-2 text-base">{t(step.titleKey)}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{t(step.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== CIVIC SERVICES ====== */}
      <section className="bg-white py-14 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-2">{t('home.servicesTitle')}</h2>
            <p className="text-text-secondary">{t('home.servicesSubtitle')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {CIVIC_SERVICES.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>
      </section>

      {/* ====== LATEST UPDATES ====== */}
      <section className="bg-page-bg py-14 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-2">{t('home.updatesTitle')}</h2>
            <p className="text-text-secondary">{t('home.updatesSubtitle')}</p>
            <p className="text-text-secondary text-sm italic mt-1">{t('home.updatesDisclaimer')}</p>
          </div>
          <div className="space-y-4">
            {MOCK_CIVIC_UPDATES.map((update) => (
              <div key={update.id} className="flex bg-white border border-border rounded-lg overflow-hidden hover:shadow-sm transition-shadow">
                <div className={`w-1.5 shrink-0 ${SEVERITY_STYLES[update.severity] || 'bg-navy'}`} aria-hidden="true" />
                <div className="flex-1 p-4 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                    <span className="text-xs font-medium text-navy bg-navy/5 px-2 py-0.5 rounded">{update.category}</span>
                    <time className="text-xs text-text-secondary">{update.date}</time>
                  </div>
                  <h3 className="font-semibold text-text-primary text-sm mb-1">{update.title}</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">{update.description}</p>
                </div>
                <div className="flex items-start p-4 shrink-0" aria-hidden="true"><Bell size={16} className="text-text-secondary" /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="bg-navy py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">{t('home.ctaTitle')}</h2>
          <p className="text-white/70 mb-6 max-w-xl mx-auto leading-relaxed">{t('home.ctaDesc')}</p>
          <Link to="/report" className="inline-flex items-center gap-2 bg-saffron hover:bg-saffron-light text-white font-semibold px-7 py-3 rounded-lg transition-colors">
            {t('home.ctaBtn')}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
