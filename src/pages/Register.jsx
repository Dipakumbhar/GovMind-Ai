import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Register() {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', ward: '', password: '', confirmPassword: '', agreed: false });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
    if (submitError) setSubmitError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = t('register.errors.nameRequired');
    else if (form.name.trim().length < 2) newErrors.name = t('register.errors.nameMin');
    if (!form.email.trim()) newErrors.email = t('register.errors.emailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = t('register.errors.emailInvalid');
    if (!form.phone.trim()) newErrors.phone = t('register.errors.phoneRequired');
    else if (!/^[+]?[\d\s-]{10,15}$/.test(form.phone.replace(/\s/g, ''))) newErrors.phone = t('register.errors.phoneInvalid');
    if (!form.password) newErrors.password = t('register.errors.passwordRequired');
    else if (form.password.length < 8) newErrors.password = t('register.errors.passwordMin');
    if (!form.confirmPassword) newErrors.confirmPassword = t('register.errors.confirmRequired');
    else if (form.password !== form.confirmPassword) newErrors.confirmPassword = t('register.errors.passwordMismatch');
    if (!form.agreed) newErrors.agreed = t('register.errors.agreeRequired');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitError(t('register.backendNote'));
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
            <h1 className="text-xl font-bold text-navy">{t('register.createAccount')}</h1>
            <p className="text-text-secondary text-sm mt-1">{t('register.subtitle')}</p>
          </div>

          {submitError && (
            <div className="flex items-start gap-2 bg-blue-50 border border-navy/10 rounded-lg p-3 mb-4">
              <AlertCircle size={16} className="text-navy mt-0.5 shrink-0" />
              <p className="text-sm text-navy">{submitError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <FormField label={t('register.fullNameLabel')} name="name" type="text" value={form.name} onChange={handleChange} error={errors.name} icon={User} placeholder={t('register.fullNamePlaceholder')} />
            <FormField label={t('register.emailLabel')} name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} icon={Mail} placeholder={t('register.emailPlaceholder')} />
            <FormField label={t('register.phoneLabel')} name="phone" type="tel" value={form.phone} onChange={handleChange} error={errors.phone} icon={Phone} placeholder={t('register.phonePlaceholder')} />
            <FormField label={t('register.wardLabel')} name="ward" type="text" value={form.ward} onChange={handleChange} error={errors.ward} icon={MapPin} placeholder={t('register.wardPlaceholder')} required={false} />

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                {t('register.passwordLabel')} <span className="text-critical">*</span>
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange}
                  placeholder={t('register.passwordPlaceholder')}
                  className={`w-full border rounded-lg pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy ${errors.password ? 'border-critical' : 'border-border'}`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-navy">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-critical text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                {t('register.confirmPasswordLabel')} <span className="text-critical">*</span>
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input type={showConfirm ? 'text' : 'password'} name="confirmPassword" value={form.confirmPassword} onChange={handleChange}
                  placeholder={t('register.confirmPasswordPlaceholder')}
                  className={`w-full border rounded-lg pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy ${errors.confirmPassword ? 'border-critical' : 'border-border'}`} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-navy">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-critical text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            {/* Terms */}
            <div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" name="agreed" checked={form.agreed} onChange={handleChange} className="accent-navy mt-0.5" />
                <span className="text-sm text-text-secondary">{t('register.agreeTerms')}</span>
              </label>
              {errors.agreed && <p className="text-critical text-xs mt-1">{errors.agreed}</p>}
            </div>

            <button type="submit" className="w-full bg-navy text-white font-semibold py-2.5 rounded-lg hover:bg-navy-dark transition-colors">
              {t('register.registerBtn')}
            </button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-5">
            {t('register.alreadyHaveAccount')}{' '}
            <Link to="/login" className="text-navy font-medium hover:text-saffron">{t('register.login')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, name, type, value, onChange, error, icon: Icon, placeholder, required = true }) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-primary mb-1.5">
        {label} {required && <span className="text-critical">*</span>}
      </label>
      <div className="relative">
        <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
          className={`w-full border rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy ${error ? 'border-critical' : 'border-border'}`} />
      </div>
      {error && <p className="text-critical text-xs mt-1">{error}</p>}
    </div>
  );
}
