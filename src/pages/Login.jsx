import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect destination after login (default: profile)
  const from = location.state?.from?.pathname || '/profile';

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
    if (submitError) setSubmitError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!form.email.trim()) newErrors.email = t('login.errors.emailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = t('login.errors.emailInvalid');
    if (!form.password) newErrors.password = t('login.errors.passwordRequired');
    else if (form.password.length < 6) newErrors.password = t('login.errors.passwordMin');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      await login(form.email.trim(), form.password);
      setSubmitSuccess('Login successful! Redirecting…');
      setTimeout(() => navigate(from, { replace: true }), 800);
    } catch (err) {
      // err is the parsed JSON from the API
      setSubmitError(err?.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white border border-border rounded-lg shadow-sm p-8">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-2">
              <svg viewBox="0 0 40 40" fill="none" className="h-10 w-10" aria-hidden="true">
                <rect x="6" y="24" width="28" height="3" rx="1" fill="#0B3A6E" />
                <rect x="9" y="14" width="22" height="10" rx="1" fill="#0B3A6E" />
                <rect x="12" y="16" width="2" height="7" rx="0.5" fill="#F4F7FA" />
                <rect x="17" y="16" width="2" height="7" rx="0.5" fill="#F4F7FA" />
                <rect x="22" y="16" width="2" height="7" rx="0.5" fill="#F4F7FA" />
                <rect x="27" y="16" width="2" height="7" rx="0.5" fill="#F4F7FA" />
                <polygon points="20,5 8,14 32,14" fill="#0B3A6E" />
                <circle cx="20" cy="7.5" r="2.5" fill="#FF9933" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-navy">{t('login.welcomeBack')}</h1>
            <p className="text-text-secondary text-sm mt-1">{t('login.subtitle')}</p>
          </div>

          {/* Error message */}
          {submitError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <AlertCircle size={16} className="text-critical mt-0.5 shrink-0" />
              <p className="text-sm text-critical">{submitError}</p>
            </div>
          )}

          {/* Success message */}
          {submitSuccess && (
            <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <CheckCircle size={16} className="text-success mt-0.5 shrink-0" />
              <p className="text-sm text-success">{submitSuccess}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">{t('login.emailLabel')}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type="email"
                  name="email"
                  id="login-email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder={t('login.emailPlaceholder')}
                  disabled={isSubmitting}
                  className={`w-full border rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy disabled:opacity-60 ${errors.email ? 'border-critical' : 'border-border'}`}
                />
              </div>
              {errors.email && <p className="text-critical text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">{t('login.passwordLabel')}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  id="login-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder={t('login.passwordPlaceholder')}
                  disabled={isSubmitting}
                  className={`w-full border rounded-lg pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy disabled:opacity-60 ${errors.password ? 'border-critical' : 'border-border'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-navy"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-critical text-xs mt-1">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="remember"
                  checked={form.remember}
                  onChange={handleChange}
                  className="accent-navy"
                />
                <span className="text-sm text-text-secondary">{t('login.rememberMe')}</span>
              </label>
              <button type="button" className="text-sm text-navy hover:text-saffron font-medium">
                {t('login.forgotPassword')}
              </button>
            </div>

            <button
              type="submit"
              id="login-submit"
              disabled={isSubmitting}
              className="w-full bg-navy text-white font-semibold py-2.5 rounded-lg hover:bg-navy-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                t('login.loginBtn')
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-secondary">{t('login.or')}</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <p className="text-center text-sm text-text-secondary">
            {t('login.noAccount')}{' '}
            <Link to="/register" className="text-navy font-medium hover:text-saffron">
              {t('login.register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
