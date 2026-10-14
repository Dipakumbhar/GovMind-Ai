import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User, Mail, Phone, MapPin, Home as HomeIcon, Calendar,
  FileText, ArrowRight, Edit, CheckCircle, Clock, AlertCircle,
  Globe, Bell, Lock, Save, X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MOCK_USER } from '../data/mockData';

export default function Profile() {
  const { t } = useTranslation();

  const STAT_CARDS = [
    { labelKey: 'profile.totalComplaints', value: MOCK_USER.totalComplaints,  icon: FileText,     bg: 'bg-navy/5',     text: 'text-navy' },
    { labelKey: 'profile.resolved',        value: MOCK_USER.resolvedComplaints, icon: CheckCircle, bg: 'bg-success/10', text: 'text-success' },
    { labelKey: 'profile.pending',         value: MOCK_USER.totalComplaints - MOCK_USER.resolvedComplaints, icon: Clock, bg: 'bg-saffron/10', text: 'text-saffron' },
    { labelKey: 'profile.resolutionRate',  value: `${Math.round((MOCK_USER.resolvedComplaints / MOCK_USER.totalComplaints) * 100)}%`, icon: AlertCircle, bg: 'bg-blue-50', text: 'text-navy-light' },
  ];

  const QUICK_ACTIONS = [
    { labelKey: 'profile.actions.reportNew',      to: '/report',        icon: FileText },
    { labelKey: 'profile.actions.viewComplaints',  to: '/my-complaints', icon: FileText },
    { labelKey: 'profile.actions.trackComplaint',  to: '/track',         icon: Clock },
    { labelKey: 'profile.actions.helpSupport',     to: '/help',          icon: AlertCircle },
  ];

  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({ ...MOCK_USER });
  const [showNotifPrefs, setShowNotifPrefs] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({ email: true, sms: true, statusUpdates: true, weeklyDigest: false });
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });

  const handleProfileChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });
  const handleSaveProfile = () => setEditing(false);

  const handleSavePassword = (e) => {
    e.preventDefault();
    if (passwordForm.newPass !== passwordForm.confirm) { alert('New passwords do not match.'); return; }
    if (passwordForm.newPass.length < 8) { alert('Password must be at least 8 characters.'); return; }
    alert('Password change will be available once the backend is connected.');
    setShowChangePassword(false);
    setPasswordForm({ current: '', newPass: '', confirm: '' });
  };

  const notifItems = [
    { key: 'email',         labelKey: 'profile.notifEmail',   descKey: 'profile.notifEmailDesc' },
    { key: 'sms',           labelKey: 'profile.notifSms',     descKey: 'profile.notifSmsDesc' },
    { key: 'statusUpdates', labelKey: 'profile.notifStatus',  descKey: 'profile.notifStatusDesc' },
    { key: 'weeklyDigest',  labelKey: 'profile.notifDigest',  descKey: 'profile.notifDigestDesc' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white border border-border rounded-lg p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-navy flex items-center justify-center mx-auto mb-3">
              <span className="text-white text-2xl font-bold">RK</span>
            </div>
            <h2 className="font-bold text-text-primary text-lg">{profile.name}</h2>
            <p className="text-text-secondary text-sm flex items-center justify-center gap-1 mt-1">
              <Calendar size={13} /> {t('profile.memberSince', { date: profile.memberSince })}
            </p>
            <button onClick={() => setEditing(!editing)}
              className="mt-4 inline-flex items-center gap-1.5 border border-border text-text-secondary text-sm font-medium px-4 py-2 rounded-lg hover:bg-page-bg transition-colors">
              <Edit size={14} /> {editing ? t('profile.cancelEditing') : t('profile.editProfile')}
            </button>
          </div>

          <div className="bg-white border border-border rounded-lg p-4 space-y-2">
            <button onClick={() => { setShowNotifPrefs(!showNotifPrefs); setShowChangePassword(false); }}
              className="w-full flex items-center gap-2 text-sm text-text-primary hover:text-navy py-2 px-3 rounded-lg hover:bg-page-bg transition-colors text-left">
              <Bell size={15} /> {t('profile.notificationPreferences')}
            </button>
            <button onClick={() => { setShowChangePassword(!showChangePassword); setShowNotifPrefs(false); }}
              className="w-full flex items-center gap-2 text-sm text-text-primary hover:text-navy py-2 px-3 rounded-lg hover:bg-page-bg transition-colors text-left">
              <Lock size={15} /> {t('profile.changePassword')}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-2 space-y-6">

          {/* Personal info */}
          <div className="bg-white border border-border rounded-lg p-6">
            <h3 className="font-semibold text-navy mb-4">{t('profile.personalInfo')}</h3>
            {editing ? (
              <div className="space-y-4">
                <EditField label={t('profile.fullName')} name="name"    value={profile.name}              onChange={handleProfileChange} icon={User} />
                <EditField label={t('profile.email')}    name="email"   value={profile.email}             onChange={handleProfileChange} icon={Mail} type="email" />
                <EditField label={t('profile.phone')}    name="phone"   value={profile.phone}             onChange={handleProfileChange} icon={Phone} type="tel" />
                <EditField label={t('profile.ward')}     name="ward"    value={profile.ward}              onChange={handleProfileChange} icon={MapPin} />
                <EditField label={t('profile.address')}  name="address" value={profile.address}           onChange={handleProfileChange} icon={HomeIcon} />
                <EditField label={t('profile.cityArea')} name="city"    value={profile.city}              onChange={handleProfileChange} icon={MapPin} />
                <div>
                  <label className="block text-xs text-text-secondary mb-1">{t('profile.preferredLanguage')}</label>
                  <div className="relative">
                    <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <select name="preferredLanguage" value={profile.preferredLanguage} onChange={handleProfileChange}
                      className="w-full border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 bg-white">
                      <option>English</option>
                      <option>मराठी</option>
                      <option>हिंदी</option>
                    </select>
                  </div>
                </div>
                <button onClick={handleSaveProfile}
                  className="flex items-center gap-1.5 bg-navy text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-navy-dark transition-colors">
                  <Save size={14} /> {t('profile.saveChanges')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoItem icon={User}     label={t('profile.fullName')}         value={profile.name} />
                <InfoItem icon={Mail}     label={t('profile.email')}            value={profile.email} />
                <InfoItem icon={Phone}    label={t('profile.phone')}            value={profile.phone} />
                <InfoItem icon={MapPin}   label={t('profile.ward')}             value={profile.ward} />
                <InfoItem icon={HomeIcon} label={t('profile.address')}          value={profile.address} />
                <InfoItem icon={MapPin}   label={t('profile.cityArea')}         value={profile.city} />
                <InfoItem icon={Globe}    label={t('profile.preferredLanguage')} value={profile.preferredLanguage} />
              </div>
            )}
          </div>

          {/* Notification Preferences */}
          {showNotifPrefs && (
            <div className="bg-white border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-navy">{t('profile.notifTitle')}</h3>
                <button onClick={() => setShowNotifPrefs(false)} className="text-text-secondary hover:text-navy"><X size={18} /></button>
              </div>
              <div className="space-y-3">
                {notifItems.map((pref) => (
                  <label key={pref.key} className="flex items-center justify-between border border-border rounded-lg p-3 cursor-pointer hover:bg-page-bg transition-colors">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{t(pref.labelKey)}</p>
                      <p className="text-xs text-text-secondary">{t(pref.descKey)}</p>
                    </div>
                    <input type="checkbox" checked={notifPrefs[pref.key]}
                      onChange={() => setNotifPrefs({ ...notifPrefs, [pref.key]: !notifPrefs[pref.key] })}
                      className="accent-navy w-4 h-4" />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Change Password */}
          {showChangePassword && (
            <div className="bg-white border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-navy">{t('profile.changePasswordTitle')}</h3>
                <button onClick={() => setShowChangePassword(false)} className="text-text-secondary hover:text-navy"><X size={18} /></button>
              </div>
              <form onSubmit={handleSavePassword} className="space-y-4 max-w-sm">
                <div>
                  <label className="block text-xs text-text-secondary mb-1">{t('profile.currentPassword')}</label>
                  <input type="password" value={passwordForm.current} onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                    required className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">{t('profile.newPassword')}</label>
                  <input type="password" value={passwordForm.newPass} onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })}
                    required minLength={8} className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" />
                  <p className="text-[11px] text-text-secondary mt-1">{t('profile.minChars')}</p>
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">{t('profile.confirmNewPassword')}</label>
                  <input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                    required className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" />
                </div>
                <button type="submit" className="flex items-center gap-1.5 bg-navy text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-navy-dark transition-colors">
                  <Lock size={14} /> {t('profile.updatePassword')}
                </button>
              </form>
            </div>
          )}

          {/* Stats */}
          <div className="bg-white border border-border rounded-lg p-6">
            <h3 className="font-semibold text-navy mb-4">{t('profile.statsTitle')}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {STAT_CARDS.map((stat) => (
                <div key={stat.labelKey} className={`${stat.bg} rounded-lg p-4 text-center`}>
                  <stat.icon size={20} className={`${stat.text} mx-auto mb-1`} />
                  <p className={`text-2xl font-bold ${stat.text}`}>{stat.value}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{t(stat.labelKey)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white border border-border rounded-lg p-6">
            <h3 className="font-semibold text-navy mb-4">{t('profile.quickActions')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {QUICK_ACTIONS.map((action) => (
                <Link key={action.to} to={action.to}
                  className="flex items-center justify-between border border-border rounded-lg p-3 hover:bg-page-bg transition-colors group">
                  <div className="flex items-center gap-2">
                    <action.icon size={16} className="text-navy" />
                    <span className="text-sm font-medium text-text-primary">{t(action.labelKey)}</span>
                  </div>
                  <ArrowRight size={14} className="text-text-secondary group-hover:text-navy transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={14} className="text-text-secondary mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-text-secondary">{label}</p>
        <p className="text-sm font-medium text-text-primary">{value}</p>
      </div>
    </div>
  );
}

function EditField({ label, name, value, onChange, icon: Icon, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs text-text-secondary mb-1">{label}</label>
      <div className="relative">
        <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input type={type} name={name} value={value} onChange={onChange}
          className="w-full border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy" />
      </div>
    </div>
  );
}
