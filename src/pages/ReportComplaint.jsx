import { useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ChevronRight, ChevronLeft, Home, Send, CheckCircle,
  ArrowRight, Upload, Camera, X, Image as ImageIcon,
  FileText, MapPin, ImagePlus, ClipboardCheck, Rocket,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CIVIC_SERVICES, generateComplaintId } from '../data/mockData';
import LocationPicker from '../components/ui/LocationPicker';

export default function ReportComplaint() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const preselectedCategory = searchParams.get('category') || '';
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const STEPS = [
    { num: 1, labelKey: 'report.steps.1', icon: FileText },
    { num: 2, labelKey: 'report.steps.2', icon: MapPin },
    { num: 3, labelKey: 'report.steps.3', icon: ImagePlus },
    { num: 4, labelKey: 'report.steps.4', icon: ClipboardCheck },
    { num: 5, labelKey: 'report.steps.5', icon: Rocket },
  ];

  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [complaintId, setComplaintId] = useState('');
  const [submittedDate, setSubmittedDate] = useState('');
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({ category: preselectedCategory, title: '', description: '' });
  const [location, setLocation] = useState({ address: '', ward: '', pincode: '', lat: '', lng: '' });
  const [files, setFiles] = useState([]);

  // ── Handlers ──
  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleFileAdd = (e) => {
    const newFiles = Array.from(e.target.files || []);
    const validFiles = newFiles.filter((f) => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024);
    setFiles((prev) => [...prev, ...validFiles].slice(0, 5));
    e.target.value = '';
  };

  const removeFile = (index) => setFiles((prev) => prev.filter((_, i) => i !== index));

  // ── Validation ──
  const validateStep = (s) => {
    const newErrors = {};
    if (s === 1) {
      if (!form.category)              newErrors.category    = t('report.errors.selectCategory');
      if (!form.title.trim())          newErrors.title       = t('report.errors.enterTitle');
      if (!form.description.trim())    newErrors.description = t('report.errors.enterDesc');
      else if (form.description.trim().length < 20) newErrors.description = t('report.errors.descMin');
    }
    if (s === 2) {
      if (!location.address.trim())    newErrors.address     = t('report.errors.enterLocation');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Navigation ──
  const goNext = () => {
    if (!validateStep(step)) return;
    if (step === 4) {
      const id = generateComplaintId();
      setComplaintId(id);
      setSubmittedDate(new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }));
      setSubmitted(true);
      setStep(5);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setStep((prev) => Math.min(prev + 1, 5));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetAll = () => {
    setForm({ category: '', title: '', description: '' });
    setLocation({ address: '', ward: '', pincode: '', lat: '', lng: '' });
    setFiles([]);
    setStep(1);
    setSubmitted(false);
    setComplaintId('');
    setErrors({});
  };

  const getCategoryName = () =>
    CIVIC_SERVICES.find((s) => s.id === form.category)?.name || form.category || '—';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-text-secondary mb-6">
        <Link to="/" className="hover:text-navy flex items-center gap-1">
          <Home size={14} /> {t('report.breadcrumbHome')}
        </Link>
        <ChevronRight size={14} />
        <span className="text-navy font-medium">{t('report.breadcrumb')}</span>
      </nav>

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy mb-1">{t('report.pageTitle')}</h1>
        <p className="text-text-secondary">{t('report.pageSubtitle')}</p>
      </div>

      {/* Step indicator */}
      {!submitted && (
        <div className="bg-white border border-border rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            {STEPS.slice(0, 4).map((s, i) => {
              const isActive = step === s.num;
              const isComplete = step > s.num;
              return (
                <div key={s.num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${isComplete ? 'bg-success text-white' : isActive ? 'bg-navy text-white' : 'bg-page-bg text-text-secondary border border-border'}`}>
                      {isComplete ? <CheckCircle size={18} /> : s.num}
                    </div>
                    <span className={`text-[11px] mt-1.5 font-medium text-center hidden sm:block ${isActive ? 'text-navy' : 'text-text-secondary'}`}>
                      {t(s.labelKey)}
                    </span>
                  </div>
                  {i < 3 && <div className={`h-px flex-1 mx-1 ${step > s.num ? 'bg-success' : 'bg-border'}`} />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ STEP 1: Issue Details ══ */}
      {step === 1 && (
        <div className="bg-white border border-border rounded-lg shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-semibold text-navy">{t('report.step1Title')}</h2>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              {t('report.categoryLabel')} <span className="text-critical">*</span>
            </label>
            <select name="category" value={form.category} onChange={handleFormChange}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy bg-white ${errors.category ? 'border-critical' : 'border-border'}`}>
              <option value="">{t('report.selectCategory')}</option>
              {CIVIC_SERVICES.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {errors.category && <p className="text-critical text-xs mt-1">{errors.category}</p>}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              {t('report.titleLabel')} <span className="text-critical">*</span>
            </label>
            <input type="text" name="title" value={form.title} onChange={handleFormChange}
              placeholder={t('report.titlePlaceholder')}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy ${errors.title ? 'border-critical' : 'border-border'}`} />
            {errors.title && <p className="text-critical text-xs mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              {t('report.descLabel')} <span className="text-critical">*</span>
            </label>
            <textarea name="description" value={form.description} onChange={handleFormChange} rows={5}
              placeholder={t('report.descPlaceholder')}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy resize-y ${errors.description ? 'border-critical' : 'border-border'}`} />
            {errors.description && <p className="text-critical text-xs mt-1">{errors.description}</p>}
            <p className="text-xs text-text-secondary mt-1">
              {t('report.charCount', { count: form.description.length })}
            </p>
          </div>
        </div>
      )}

      {/* ══ STEP 2: Location ══ */}
      {step === 2 && (
        <div className="bg-white border border-border rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-navy mb-4">{t('report.step2Title')}</h2>
          <LocationPicker value={location} onChange={setLocation} />
          {errors.address && <p className="text-critical text-xs mt-2">{errors.address}</p>}
        </div>
      )}

      {/* ══ STEP 3: Media ══ */}
      {step === 3 && (
        <div className="bg-white border border-border rounded-lg shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-semibold text-navy">{t('report.step3Title')}</h2>
          <p className="text-text-secondary text-sm">{t('report.step3Desc')}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Camera */}
            <button type="button" onClick={() => cameraInputRef.current?.click()}
              className="flex flex-col items-center gap-2 border-2 border-dashed border-border rounded-lg p-6 hover:border-navy/30 hover:bg-navy/5 transition-colors cursor-pointer">
              <Camera size={28} className="text-navy" />
              <span className="text-sm font-medium text-text-primary">{t('report.clickPhoto')}</span>
              <span className="text-xs text-text-secondary">{t('report.useCamera')}</span>
            </button>
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileAdd} className="hidden" />

            {/* Upload */}
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-2 border-2 border-dashed border-border rounded-lg p-6 hover:border-navy/30 hover:bg-navy/5 transition-colors cursor-pointer">
              <Upload size={28} className="text-navy" />
              <span className="text-sm font-medium text-text-primary">{t('report.uploadImage')}</span>
              <span className="text-xs text-text-secondary">{t('report.uploadFormats')}</span>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileAdd} className="hidden" />
          </div>

          {/* File preview */}
          {files.length > 0 && (
            <div>
              <p className="text-sm font-medium text-text-primary mb-2">
                {t('report.attachedFiles', { count: files.length })}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {files.map((file, i) => (
                  <div key={i} className="relative border border-border rounded-lg overflow-hidden group">
                    <div className="aspect-square bg-page-bg flex items-center justify-center">
                      {file.type.startsWith('image/') ? (
                        <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={32} className="text-text-secondary" />
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs text-text-primary truncate">{file.name}</p>
                      <p className="text-[11px] text-text-secondary">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                    </div>
                    <button type="button" onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 w-6 h-6 bg-white/90 border border-border rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-critical hover:text-white hover:border-critical">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {files.length === 0 && (
            <div className="bg-navy/5 border border-navy/10 rounded-lg p-3">
              <p className="text-xs text-text-secondary">
                <span className="font-medium text-navy">{t('report.optional')}</span>{' '}
                {t('report.optionalMedia')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ══ STEP 4: Review ══ */}
      {step === 4 && (
        <div className="bg-white border border-border rounded-lg shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-semibold text-navy">{t('report.step4Title')}</h2>
          <p className="text-text-secondary text-sm">{t('report.step4Desc')}</p>

          <ReviewSection title={t('report.reviewIssueDetails')}>
            <ReviewRow label={t('report.reviewLabels.category')}    value={getCategoryName()} />
            <ReviewRow label={t('report.reviewLabels.title')}       value={form.title} />
            <ReviewRow label={t('report.reviewLabels.description')} value={form.description} />
          </ReviewSection>

          <ReviewSection title={t('report.reviewLocation')}>
            <ReviewRow label={t('report.reviewLabels.address')} value={location.address || '—'} />
            <ReviewRow label={t('report.reviewLabels.ward')}    value={location.ward || '—'} />
            <ReviewRow label={t('report.reviewLabels.pincode')} value={location.pincode || '—'} />
          </ReviewSection>

          <ReviewSection title={t('report.reviewMedia')}>
            {files.length === 0 ? (
              <p className="text-sm text-text-secondary">{t('report.noFiles')}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 bg-page-bg border border-border rounded px-2 py-1">
                    <ImageIcon size={14} className="text-text-secondary" />
                    <span className="text-xs text-text-primary">{file.name}</span>
                    <span className="text-[11px] text-text-secondary">({(file.size / (1024 * 1024)).toFixed(1)} MB)</span>
                  </div>
                ))}
              </div>
            )}
          </ReviewSection>

          <div className="bg-navy/5 border border-navy/10 rounded-lg p-3">
            <p className="text-xs text-text-secondary">
              <span className="font-medium text-navy">{t('report.note')}</span>{' '}
              {t('report.aiNote')}
            </p>
          </div>
        </div>
      )}

      {/* ══ STEP 5: Success ══ */}
      {step === 5 && submitted && (
        <div className="bg-white border border-border rounded-lg p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle size={36} className="text-success" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-navy mb-2">{t('report.successTitle')}</h2>
          <p className="text-text-secondary mb-6">{t('report.successDesc')}</p>

          <div className="bg-page-bg border border-border rounded-lg p-5 mb-6 inline-block text-left mx-auto max-w-sm w-full">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-text-secondary">{t('report.complaintId')}</p>
                <p className="text-xl font-bold text-navy font-mono">{complaintId}</p>
              </div>
              <div className="flex gap-6">
                <div>
                  <p className="text-xs text-text-secondary">{t('report.statusLabel')}</p>
                  <span className="inline-flex items-center gap-1.5 bg-blue-100 text-navy text-xs font-medium px-2 py-0.5 rounded-full mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-navy" />
                    {t('report.statusSubmitted')}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">{t('report.submittedDate')}</p>
                  <p className="text-sm font-medium text-text-primary mt-0.5">{submittedDate}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/track" className="flex items-center gap-2 bg-navy text-white font-medium px-5 py-2.5 rounded-lg hover:bg-navy-dark transition-colors">
              {t('report.trackComplaint')} <ArrowRight size={16} />
            </Link>
            <Link to="/my-complaints" className="flex items-center gap-2 border border-border text-text-secondary font-medium px-5 py-2.5 rounded-lg hover:bg-page-bg transition-colors">
              {t('report.viewMyComplaints')}
            </Link>
            <Link to="/" className="flex items-center gap-2 text-text-secondary font-medium px-5 py-2.5 hover:text-navy transition-colors">
              {t('report.backToHome')}
            </Link>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      {!submitted && (
        <div className="flex items-center justify-between mt-6">
          {step > 1 ? (
            <button type="button" onClick={goBack}
              className="flex items-center gap-1.5 border border-border text-text-secondary font-medium px-5 py-2.5 rounded-lg hover:bg-white transition-colors">
              <ChevronLeft size={16} /> {t('report.back')}
            </button>
          ) : <div />}

          <button type="button" onClick={goNext}
            className={`flex items-center gap-2 font-semibold px-6 py-2.5 rounded-lg transition-colors ${step === 4 ? 'bg-success text-white hover:bg-green-700' : 'bg-navy text-white hover:bg-navy-dark'}`}>
            {step === 4 ? (
              <><Send size={16} /> {t('report.submitComplaint')}</>
            ) : (
              <>{t('report.next')} <ChevronRight size={16} /></>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function ReviewSection({ title, children }) {
  return (
    <div className="border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-navy mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1">
      <span className="text-xs text-text-secondary w-28 shrink-0">{label}</span>
      <span className="text-sm text-text-primary break-words">{value || '—'}</span>
    </div>
  );
}
