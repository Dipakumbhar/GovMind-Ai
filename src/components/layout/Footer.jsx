import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

const QUICK_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/report', label: 'Report Complaint' },
  { to: '/track', label: 'Track Complaint' },
  { to: '/services', label: 'Services' },
  { to: '/help', label: 'Help & Support' },
];

export default function Footer() {
  return (
    <footer className="bg-navy text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8">
                <rect x="6" y="24" width="28" height="3" rx="1" fill="#fff" />
                <rect x="9" y="14" width="22" height="10" rx="1" fill="#fff" />
                <rect x="12" y="16" width="2" height="7" rx="0.5" fill="#0B3A6E" />
                <rect x="17" y="16" width="2" height="7" rx="0.5" fill="#0B3A6E" />
                <rect x="22" y="16" width="2" height="7" rx="0.5" fill="#0B3A6E" />
                <rect x="27" y="16" width="2" height="7" rx="0.5" fill="#0B3A6E" />
                <polygon points="20,5 8,14 32,14" fill="#fff" />
                <circle cx="20" cy="7.5" r="2.5" fill="#FF9933" />
              </svg>
              <div>
                <span className="font-bold text-lg">GovMind AI</span>
                <span className="block text-white/60 text-xs">Smart Civic Governance</span>
              </div>
            </div>
            <p className="text-white/70 text-sm leading-relaxed mb-3">
              A multi-agent AI platform for smart civic governance and intelligent decision support.
            </p>
            <p className="text-white/50 text-xs italic">
              College Project – Not an official government website
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-saffron font-semibold text-sm uppercase tracking-wider mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {QUICK_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-white/70 text-sm hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-saffron font-semibold text-sm uppercase tracking-wider mb-4">Contact (Demo)</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-white/70 text-sm">
                <Mail size={16} className="mt-0.5 shrink-0" />
                support@govmind.ai
              </li>
              <li className="flex items-start gap-2 text-white/70 text-sm">
                <Phone size={16} className="mt-0.5 shrink-0" />
                1800-XXX-XXXX (Demo)
              </li>
              <li className="flex items-start gap-2 text-white/70 text-sm">
                <MapPin size={16} className="mt-0.5 shrink-0" />
                Demo City Municipal Corporation
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <p className="text-center text-white/50 text-xs">
            © 2026 GovMind AI. College project for demonstration purposes only.
          </p>
        </div>
      </div>
    </footer>
  );
}
