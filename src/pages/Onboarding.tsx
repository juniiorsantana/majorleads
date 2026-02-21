import React, { useState, useEffect } from 'react';
import {
  Hexagon,
  Check,
  Code,
  ShoppingBag,
  Globe,
  Tag,
  Info,
  Mail,
  ArrowRight,
  ChevronLeft,
  AlertCircle,
  Loader2,
  Layout,
  Copy,
  Users,
  Zap,
  TrendingUp,
  BarChart2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

/* ─────────────────────────────────────────────────────────
   LEFT PANEL — Brand & Social Proof
───────────────────────────────────────────────────────── */
const stats = [
  { icon: Users, value: '12.4k', label: 'Leads captured today', color: '#22d3ee' },
  { icon: TrendingUp, value: '94%', label: 'Avg. capture rate', color: '#4ade80' },
  { icon: Zap, value: '< 1s', label: 'Script load time', color: '#facc15' },
];

function CountUp({ target }: { target: string }) {
  return <span className="tabular-nums">{target}</span>;
}

function LeftPanel() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="hidden lg:flex flex-col justify-between h-full px-12 py-14"
      style={{ background: 'linear-gradient(160deg, #0a0a0a 0%, #111827 100%)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <Hexagon className="text-cyan-400 fill-cyan-400" size={32} />
        <span className="text-xl font-bold tracking-tight text-white">MajorLeads</span>
      </div>

      {/* Hero copy */}
      <div>
        <p className="text-cyan-400 text-xs font-semibold uppercase tracking-widest mb-4">
          Setup · 3 steps · &lt; 2 min
        </p>
        <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
          Turn visitors into<br />
          <span className="text-transparent bg-clip-text"
            style={{ backgroundImage: 'linear-gradient(90deg, #22d3ee, #4ade80)' }}>
            qualified leads.
          </span>
        </h2>
        <p className="text-zinc-400 text-base leading-relaxed max-w-xs">
          Install one script. Watch leads, popups, and conversions flow into your dashboard in real time.
        </p>

        {/* Live stats */}
        <div className="mt-10 space-y-4">
          {stats.map(({ icon: Icon, value, label, color }, i) => (
            <div
              key={label}
              className="flex items-center gap-4 p-4 rounded-xl border"
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderColor: 'rgba(255,255,255,0.08)',
                animation: `fadeSlideIn 0.5s ease ${i * 0.1}s both`
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${color}18`, color }}
              >
                <Icon size={18} />
              </div>
              <div>
                <p className="text-white font-bold text-lg leading-none">
                  <span key={tick}><CountUp target={value} /></span>
                </p>
                <p className="text-zinc-500 text-xs mt-0.5">{label}</p>
              </div>
              <div
                className="ml-auto w-2 h-2 rounded-full animate-pulse"
                style={{ background: color }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <p className="text-zinc-600 text-xs">
        Trusted by 3,200+ growth teams · LGPD &amp; GDPR compliant
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   STEP INDICATOR
───────────────────────────────────────────────────────── */
const STEPS = ['Create Site', 'Install Script', 'Verify'];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const done = current > step;
        const active = current === step;
        return (
          <React.Fragment key={label}>
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300
                  ${done ? 'bg-emerald-500 border-emerald-500 text-white'
                    : active ? 'bg-zinc-900 border-zinc-900 text-white shadow-lg shadow-zinc-900/20'
                      : 'bg-white border-zinc-200 text-zinc-400'}`}
              >
                {done ? <Check size={14} strokeWidth={3} /> : step}
              </div>
              <span className={`text-sm font-medium transition-colors ${active ? 'text-zinc-900' : 'text-zinc-400'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-3 transition-colors duration-500 ${current > step ? 'bg-emerald-400' : 'bg-zinc-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────── */
export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({ siteName: '', siteUrl: '', platform: 'HTML / Custom' });
  const [errors, setErrors] = useState({ siteUrl: '' });
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [siteId, setSiteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // If onboarding already completed, redirect to dashboard
  useEffect(() => {
    if (localStorage.getItem('onboarding_complete') === 'true') {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'siteUrl') setErrors(prev => ({ ...prev, siteUrl: '' }));
  };

  const validateStep1 = () => {
    if (!formData.siteName || !formData.siteUrl) return false;
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;
    if (!urlPattern.test(formData.siteUrl)) {
      setErrors({ siteUrl: 'Please enter a valid URL (e.g. https://yoursite.com)' });
      return false;
    }
    return true;
  };

  // Save site to Supabase and move to step 2
  const handleStep1Continue = async () => {
    if (!validateStep1()) return;
    if (!user) return;

    setSaving(true);
    try {
      // Check if site already exists for this domain
      const domain = formData.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const { data: existing } = await supabase
        .from('sites')
        .select('id')
        .eq('user_id', user.id)
        .eq('domain', domain)
        .maybeSingle();

      if (existing) {
        setSiteId(existing.id);
      } else {
        const { data, error } = await supabase
          .from('sites')
          .insert({ user_id: user.id, name: formData.siteName, domain })
          .select('id')
          .single();

        if (error) throw error;
        setSiteId(data.id);
      }

      setCurrentStep(2);
    } catch (err) {
      console.error('Error saving site:', err);
      // Still allow moving forward even if DB fails
      setCurrentStep(2);
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => prev - 1);

  const trackerToken = siteId ?? 'pk_live_YOUR_TOKEN';
  const trackerSnippet = `<script\n  src="https://tracker.majorhub.com.br/tracker.js"\n  data-token="${trackerToken}"\n  async>\n</script>`;

  const copyCode = () => {
    navigator.clipboard.writeText(trackerSnippet)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const checkInstallation = () => {
    setVerificationStatus('checking');
    // In production this will ping tracker.majorhub.com.br to verify the token is active
    setTimeout(() => {
      setVerificationStatus('success');
    }, 2000);
  };

  const finishOnboarding = () => {
    localStorage.setItem('onboarding_complete', 'true');
    navigate('/dashboard/sites');
  };

  return (
    <>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.94); }
          to   { opacity: 1; transform: scale(1); }
        }
        .form-panel { animation: scaleIn 0.35s ease both; }
      `}</style>

      <div className="min-h-screen flex" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

        {/* ── LEFT: Brand Panel ─────────────────── */}
        <div className="w-[38%] shrink-0">
          <LeftPanel />
        </div>

        {/* ── RIGHT: Form Panel ─────────────────── */}
        <div className="flex-1 flex flex-col bg-zinc-50/60 overflow-y-auto">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 p-6 border-b border-zinc-100 bg-white">
            <Hexagon className="text-zinc-900 fill-zinc-900" size={24} />
            <span className="text-lg font-bold text-zinc-900">MajorLeads</span>
          </div>

          <div className="flex-1 flex flex-col justify-center px-8 py-12 max-w-xl mx-auto w-full">

            {/* Step title */}
            <div className="mb-8">
              {currentStep === 1 && <>
                <h1 className="text-2xl font-extrabold text-zinc-900 mb-1">Set up your site</h1>
                <p className="text-zinc-500 text-sm">Tell us where to capture leads.</p>
              </>}
              {currentStep === 2 && <>
                <h1 className="text-2xl font-extrabold text-zinc-900 mb-1">Install the script</h1>
                <p className="text-zinc-500 text-sm">One snippet. Works on any platform.</p>
              </>}
              {currentStep === 3 && <>
                <h1 className="text-2xl font-extrabold text-zinc-900 mb-1">Verify installation</h1>
                <p className="text-zinc-500 text-sm">We'll ping your site to confirm it's live.</p>
              </>}
            </div>

            <StepIndicator current={currentStep} />

            {/* ── STEP 1 ─────────────────────────── */}
            {currentStep === 1 && (
              <div className="form-panel bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                <div className="p-7 space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
                      Site Name
                    </label>
                    <input
                      type="text" name="siteName" value={formData.siteName}
                      onChange={handleInputChange} placeholder="My Online Store"
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-zinc-900 text-sm
                        focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent
                        placeholder:text-zinc-300 transition-all bg-zinc-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
                      Site URL
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                      <input
                        type="text" name="siteUrl" value={formData.siteUrl}
                        onChange={handleInputChange} placeholder="https://yoursite.com"
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border text-zinc-900 text-sm
                          focus:outline-none focus:ring-2 transition-all placeholder:text-zinc-300 bg-zinc-50
                          ${errors.siteUrl
                            ? 'border-red-300 focus:ring-red-200'
                            : 'border-zinc-200 focus:ring-zinc-900 focus:border-transparent'}`}
                      />
                    </div>
                    {errors.siteUrl && (
                      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle size={12} />{errors.siteUrl}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
                      Platform
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['HTML / Custom', 'WordPress', 'Shopify', 'Webflow', 'Wix', 'Other'].map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, platform: p }))}
                          className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all
                            ${formData.platform === p
                              ? 'bg-zinc-900 border-zinc-900 text-white shadow-sm'
                              : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-400'}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="px-7 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-end">
                  <button
                    onClick={handleStep1Continue}
                    disabled={!formData.siteName || !formData.siteUrl || saving}
                    className="bg-zinc-900 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed
                      text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2
                      shadow-lg shadow-zinc-900/10 hover:shadow-xl hover:shadow-zinc-900/15 active:scale-95"
                  >
                    {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <>Continue <ArrowRight size={16} /></>}
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2 ─────────────────────────── */}
            {currentStep === 2 && (
              <div className="form-panel bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                <div className="p-7">
                  {/* Platform tabs */}
                  <div className="flex gap-1.5 mb-6 flex-wrap">
                    {[
                      { label: 'HTML', icon: Code },
                      { label: 'WordPress', icon: Globe },
                      { label: 'Shopify', icon: ShoppingBag },
                      { label: 'GTM', icon: Tag },
                    ].map(({ label, icon: Icon }) => (
                      <button key={label}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium
                          border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-400 hover:bg-white transition-all">
                        <Icon size={14} />{label}
                      </button>
                    ))}
                  </div>

                  <p className="text-zinc-500 text-sm mb-4">
                    Paste this before the closing{' '}
                    <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-800 text-xs font-mono">&lt;/head&gt;</code>{' '}
                    tag on every page.
                  </p>

                  {/* Code block */}
                  <div className="relative">
                    <pre className="bg-[#0d0d0d] rounded-xl p-5 overflow-x-auto text-xs font-mono leading-6 border border-zinc-800">
                      <code>
                        <span className="text-zinc-500">{'<!-- MajorLeads Tracker -->'}</span>{'\n'}
                        <span className="text-sky-400">{'<script'}</span>{'\n'}
                        {'  '}<span className="text-blue-300">src</span>=<span className="text-emerald-400">"https://tracker.majorhub.com.br/tracker.js"</span>{'\n'}
                        {'  '}<span className="text-blue-300">data-token</span>=<span className="text-emerald-400">"{trackerToken}"</span>{'\n'}
                        {'  '}<span className="text-blue-300">async</span><span className="text-sky-400">{'>'}</span>{'\n'}
                        <span className="text-sky-400">{'</script>'}</span>
                      </code>
                    </pre>
                    <button
                      onClick={copyCode}
                      className={`absolute top-3 right-3 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all font-medium
                        ${copied
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'}`}
                    >
                      {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                    </button>
                  </div>

                  <div className="mt-4 flex items-start gap-3 p-3.5 bg-sky-50 text-sky-800 rounded-xl text-xs border border-sky-100">
                    <Info size={14} className="text-sky-500 shrink-0 mt-0.5" />
                    <p>Need help? Our team can install this for free. <a href="#" className="underline underline-offset-2 hover:text-sky-900">Request free setup →</a></p>
                  </div>
                </div>

                <div className="px-7 py-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
                  <button onClick={prevStep} className="text-zinc-400 hover:text-zinc-800 text-sm font-medium flex items-center gap-1.5 transition-colors">
                    <ChevronLeft size={16} /> Back
                  </button>
                  <div className="flex gap-2">
                    <button className="text-zinc-500 hover:text-zinc-800 text-sm font-medium flex items-center gap-1.5 px-4 py-2 rounded-xl hover:bg-zinc-100 transition-all">
                      <Mail size={14} /> Email to dev
                    </button>
                    <button onClick={nextStep}
                      className="bg-zinc-900 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold
                        transition-all flex items-center gap-2 shadow-lg shadow-zinc-900/10 active:scale-95">
                      Verify <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3 ─────────────────────────── */}
            {currentStep === 3 && (
              <div className="form-panel bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                <div className="p-7">
                  {/* Site summary */}
                  <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-xl border border-zinc-100 mb-7">
                    <div className="w-10 h-10 bg-white rounded-xl border border-zinc-200 flex items-center justify-center shrink-0">
                      <BarChart2 className="text-zinc-700" size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-zinc-900 font-semibold text-sm truncate">{formData.siteName || 'My Site'}</h3>
                      <p className="text-zinc-400 text-xs truncate">{formData.siteUrl || 'yoursite.com'}</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-zinc-200/70 text-zinc-600 rounded-lg font-medium shrink-0">
                      {formData.platform}
                    </span>
                  </div>

                  {verificationStatus === 'idle' && (
                    <div className="text-center py-4">
                      <p className="text-zinc-500 text-sm mb-5">Visit your site once after installing the script, then click below.</p>
                      <button onClick={checkInstallation}
                        className="w-full bg-zinc-900 hover:bg-zinc-700 text-white py-3 rounded-xl font-semibold text-sm
                          transition-all shadow-lg shadow-zinc-900/10 hover:shadow-xl active:scale-95 flex items-center justify-center gap-2">
                        <Zap size={16} /> Check Installation
                      </button>
                    </div>
                  )}

                  {verificationStatus === 'checking' && (
                    <div className="py-10 flex flex-col items-center">
                      <Loader2 size={40} className="text-zinc-900 animate-spin mb-4" />
                      <p className="text-zinc-500 text-sm animate-pulse">Pinging your site...</p>
                    </div>
                  )}

                  {verificationStatus === 'success' && (
                    <div className="py-4 flex flex-col items-center text-center">
                      <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                        <Check size={28} strokeWidth={3} />
                      </div>
                      <h2 className="text-lg font-bold text-zinc-900 mb-1">Script detected! 🎉</h2>
                      <p className="text-zinc-500 text-sm mb-6">We received the first event from your site. You're good to go.</p>
                      <button onClick={finishOnboarding}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold text-sm
                          transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-95">
                        Go to Dashboard <ArrowRight size={16} />
                      </button>
                    </div>
                  )}

                  {verificationStatus === 'error' && (
                    <div className="py-4 flex flex-col items-center text-center">
                      <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
                        <AlertCircle size={28} strokeWidth={3} />
                      </div>
                      <h2 className="text-lg font-bold text-zinc-900 mb-1">Not detected yet</h2>
                      <p className="text-zinc-500 text-sm mb-5 max-w-xs">
                        Make sure the snippet is before <code className="bg-zinc-100 px-1 rounded text-xs font-mono">&lt;/head&gt;</code> and you've visited the page.
                      </p>
                      <button onClick={checkInstallation}
                        className="w-full bg-zinc-900 hover:bg-zinc-700 text-white py-2.5 rounded-xl font-semibold text-sm
                          transition-all flex items-center justify-center gap-2 active:scale-95">
                        Try Again
                      </button>
                      <button onClick={finishOnboarding} className="mt-3 text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
                        Skip and go to dashboard
                      </button>
                    </div>
                  )}
                </div>

                <div className="px-7 py-4 bg-zinc-50 border-t border-zinc-100 flex">
                  <button onClick={prevStep} className="text-zinc-400 hover:text-zinc-800 text-sm font-medium flex items-center gap-1.5 transition-colors">
                    <ChevronLeft size={16} /> Back
                  </button>
                </div>
              </div>
            )}

            {/* Skip link */}
            <div className="mt-6 text-center">
              <button onClick={() => navigate('/dashboard')}
                className="text-zinc-400 hover:text-zinc-600 text-xs transition-colors">
                Skip for now and go to dashboard →
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};