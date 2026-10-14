import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, LogIn, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const NAV_LINKS = [
  { to: '/', labelKey: 'nav.home' },
  { to: '/report', labelKey: 'nav.report' },
  { to: '/my-complaints', labelKey: 'nav.myComplaints' },
  { to: '/track', labelKey: 'nav.track' },
  { to: '/services', labelKey: 'nav.services' },
  { to: '/help', labelKey: 'nav.help' },
];

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'mr', label: 'मराठी' },
  { code: 'hi', label: 'हिंदी' },
];

export default function Header() {
  const { t, i18n } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const menuButtonRef = useRef(null);

  const activeLang = i18n.language;

  const changeLang = (code) => {
    i18n.changeLanguage(code);
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close on Escape key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && mobileOpen) {
      setMobileOpen(false);
      menuButtonRef.current?.focus();
    }
  }, [mobileOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const toggleMenu = () => setMobileOpen((prev) => !prev);
  const closeMenu = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      {/* Tricolor accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-saffron via-white to-success" aria-hidden="true" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* ── Main header row ── */}
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 shrink-0 focus-visible:outline-2 focus-visible:outline-navy rounded"
            aria-label={t('header.logoAriaLabel')}
          >
            <GovMindLogo className="h-9 w-9 sm:h-10 sm:w-10" />
            <div className="leading-tight">
              <span className="text-navy font-bold text-base sm:text-lg tracking-tight block">
                GovMind AI
              </span>
              <span className="text-text-secondary text-[10px] sm:text-[11px] font-medium -mt-0.5 hidden sm:block">
                {t('header.tagline')}
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `px-2.5 xl:px-3 py-2 text-sm font-medium rounded transition-colors border-b-2 whitespace-nowrap ${
                    isActive
                      ? 'text-navy border-saffron bg-saffron/5'
                      : 'text-text-secondary border-transparent hover:text-navy hover:bg-navy/5'
                  }`
                }
              >
                {t(link.labelKey)}
              </NavLink>
            ))}
          </nav>

          {/* Desktop right controls */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-3 shrink-0">
            {/* Language selector */}
            <div
              className="flex items-center border border-border rounded overflow-hidden text-xs"
              role="group"
              aria-label={t('header.selectLanguage')}
            >
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLang(lang.code)}
                  aria-pressed={activeLang === lang.code}
                  title={lang.label}
                  className={`px-2 py-1.5 transition-colors font-medium ${
                    activeLang === lang.code
                      ? 'bg-navy text-white'
                      : 'text-text-secondary hover:bg-navy/5 hover:text-navy'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            <Link
              to="/login"
              className="flex items-center gap-1.5 bg-navy text-white text-sm font-medium px-4 py-2 rounded hover:bg-navy-dark transition-colors whitespace-nowrap"
            >
              <LogIn size={15} aria-hidden="true" />
              {t('nav.login')}
            </Link>
          </div>

          {/* Mobile controls */}
          <div className="flex lg:hidden items-center gap-1">
            <Link
              to="/login"
              className="p-2 text-navy rounded hover:bg-navy/5 transition-colors"
              aria-label={t('header.loginAccount')}
            >
              <User size={20} aria-hidden="true" />
            </Link>
            <button
              ref={menuButtonRef}
              onClick={toggleMenu}
              className="p-2 text-navy rounded hover:bg-navy/5 transition-colors"
              aria-label={mobileOpen ? t('header.closeMenu') : t('header.openMenu')}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
            >
              {mobileOpen
                ? <X size={22} aria-hidden="true" />
                : <Menu size={22} aria-hidden="true" />
              }
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div
          id="mobile-menu"
          className="lg:hidden border-t border-border bg-white"
          role="navigation"
          aria-label="Mobile navigation"
        >
          <nav className="flex flex-col py-1 px-2">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive ? 'nav-active-mobile' : 'nav-inactive-mobile'
                  }`
                }
              >
                {t(link.labelKey)}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center justify-between px-4 py-3 mt-1 border-t border-border">
            <div
              className="flex items-center gap-1"
              role="group"
              aria-label={t('header.selectLanguage')}
            >
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => { changeLang(lang.code); }}
                  aria-pressed={activeLang === lang.code}
                  className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                    activeLang === lang.code
                      ? 'bg-navy text-white'
                      : 'text-text-secondary border border-border hover:bg-navy/5'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
            <Link
              to="/login"
              onClick={closeMenu}
              className="flex items-center gap-1.5 bg-navy text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-navy-dark transition-colors"
            >
              <LogIn size={14} aria-hidden="true" />
              {t('nav.login')}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function GovMindLogo({ className }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true" focusable="false">
      <rect x="6" y="24" width="28" height="3" rx="1" fill="#0B3A6E" />
      <rect x="9" y="14" width="22" height="10" rx="1" fill="#0B3A6E" />
      <rect x="12" y="16" width="2" height="7" rx="0.5" fill="#F4F7FA" />
      <rect x="17" y="16" width="2" height="7" rx="0.5" fill="#F4F7FA" />
      <rect x="22" y="16" width="2" height="7" rx="0.5" fill="#F4F7FA" />
      <rect x="27" y="16" width="2" height="7" rx="0.5" fill="#F4F7FA" />
      <polygon points="20,5 8,14 32,14" fill="#0B3A6E" />
      <circle cx="20" cy="7.5" r="2.5" fill="#FF9933" />
      <rect x="4" y="28" width="32" height="2" rx="1" fill="#0B3A6E" opacity="0.2" />
    </svg>
  );
}
