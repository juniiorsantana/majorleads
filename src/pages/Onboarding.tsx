import React, { useState } from 'react';
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
  Copy
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    siteName: '',
    siteUrl: '',
    platform: 'HTML / Custom'
  });
  const [errors, setErrors] = useState({ siteUrl: '' });
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'siteUrl') setErrors(prev => ({ ...prev, siteUrl: '' }));
  };

  const validateStep1 = () => {
    if (!formData.siteName || !formData.siteUrl) return false;

    // Simple URL validation
    const urlPattern = new RegExp('^(https?:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator

    if (!urlPattern.test(formData.siteUrl)) {
      setErrors({ siteUrl: 'Please enter a valid URL (e.g. https://yoursite.com)' });
      return false;
    }

    return true;
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (validateStep1()) setCurrentStep(2);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const checkInstallation = () => {
    setVerificationStatus('checking');
    // Simulate API call
    setTimeout(() => {
      // For demo purposes, let's succeed randomly or usually succeed
      const isSuccess = Math.random() > 0.2;
      setVerificationStatus(isSuccess ? 'success' : 'error');
    }, 2000);
  };

  // Render Helpers
  const renderStepIndicator = () => (
    <div className="w-full max-w-2xl mb-12">
      <div className="relative flex justify-between items-center text-sm font-medium">
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-zinc-200 -z-10 transform -translate-y-1/2"></div>

        {/* Step 1 Indicator */}
        <div className={`flex items-center gap-2 bg-zinc-50 pr-4 transition-colors ${currentStep >= 1 ? 'text-zinc-900' : 'text-zinc-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300
            ${currentStep > 1
              ? 'bg-green-100 text-green-700 border-green-200'
              : currentStep === 1
                ? 'bg-brand-600 text-white ring-4 ring-brand-100 border-transparent'
                : 'bg-zinc-100 text-zinc-400 border-zinc-200'
            }`}>
            {currentStep > 1 ? <Check size={18} /> : <span>1</span>}
          </div>
          <span className={currentStep === 1 ? 'text-brand-600 font-semibold' : ''}>Create Site</span>
        </div>

        {/* Step 2 Indicator */}
        <div className={`flex items-center gap-2 bg-zinc-50 px-4 transition-colors ${currentStep >= 2 ? 'text-zinc-900' : 'text-zinc-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300
            ${currentStep > 2
              ? 'bg-green-100 text-green-700 border-green-200'
              : currentStep === 2
                ? 'bg-brand-600 text-white ring-4 ring-brand-100 border-transparent'
                : 'bg-zinc-100 text-zinc-400 border-zinc-200'
            }`}>
            {currentStep > 2 ? <Check size={18} /> : <span>2</span>}
          </div>
          <span className={currentStep === 2 ? 'text-brand-600 font-semibold' : ''}>Install Script</span>
        </div>

        {/* Step 3 Indicator */}
        <div className={`flex items-center gap-2 bg-zinc-50 pl-4 transition-colors ${currentStep >= 3 ? 'text-zinc-900' : 'text-zinc-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300
            ${currentStep === 3
              ? 'bg-brand-600 text-white ring-4 ring-brand-100 border-transparent'
              : 'bg-zinc-100 text-zinc-400 border-zinc-200'
            }`}>
            <span>3</span>
          </div>
          <span className={currentStep === 3 ? 'text-brand-600 font-semibold' : ''}>Verify</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-zinc-50">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Hexagon className="text-brand-600 fill-brand-600" size={40} />
          <span className="text-2xl font-bold tracking-tight text-zinc-900">MajorLeads</span>
        </div>

        {currentStep === 1 && (
          <>
            <h1 className="text-3xl font-bold text-zinc-900 mb-2">Let's get your site set up 🚀</h1>
            <p className="text-zinc-500 text-lg">Tell us about the site you want to track.</p>
          </>
        )}
        {currentStep === 2 && (
          <>
            <h1 className="text-3xl font-bold text-zinc-900 mb-2">Install the tracking code 🛠️</h1>
            <p className="text-zinc-500 text-lg">Add the snippet to start collecting data.</p>
          </>
        )}
        {currentStep === 3 && (
          <>
            <h1 className="text-3xl font-bold text-zinc-900 mb-2">Verify your installation ✅</h1>
            <p className="text-zinc-500 text-lg">Check if the script is active on your site.</p>
          </>
        )}
      </div>

      {renderStepIndicator()}

      {/* STEP 1 CONTENT */}
      {currentStep === 1 && (
        <div className="w-full max-w-xl bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Site Name</label>
              <input
                type="text"
                name="siteName"
                value={formData.siteName}
                onChange={handleInputChange}
                placeholder="My Online Store"
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Site URL</label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 text-zinc-400" size={18} />
                <input
                  type="text"
                  name="siteUrl"
                  value={formData.siteUrl}
                  onChange={handleInputChange}
                  placeholder="https://yoursite.com"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-zinc-900 focus:outline-none focus:ring-2 transition-all ${errors.siteUrl
                    ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                    : 'border-zinc-300 focus:ring-brand-500 focus:border-transparent'
                    }`}
                />
              </div>
              {errors.siteUrl && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.siteUrl}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Platform</label>
              <div className="relative">
                <Layout className="absolute left-3 top-3 text-zinc-400" size={18} />
                <select
                  name="platform"
                  value={formData.platform}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-300 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent appearance-none bg-white cursor-pointer"
                >
                  <option>HTML / Custom</option>
                  <option>WordPress</option>
                  <option>Shopify</option>
                  <option>Webflow</option>
                  <option>Wix</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="px-8 py-5 bg-zinc-50 border-t border-zinc-200 flex justify-end">
            <button
              onClick={nextStep}
              disabled={!formData.siteName || !formData.siteUrl}
              className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all flex items-center gap-2"
            >
              Continue
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 CONTENT */}
      {currentStep === 2 && (
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="p-8">
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 border-b border-zinc-100">
              <button className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formData.platform === 'HTML / Custom' ? 'bg-brand-50 text-brand-900 border border-brand-100' : 'hover:bg-zinc-50 text-zinc-600 border border-transparent'}`}>
                <Code size={18} /> HTML / Custom
              </button>
              <button className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formData.platform === 'WordPress' ? 'bg-brand-50 text-brand-900 border border-brand-100' : 'hover:bg-zinc-50 text-zinc-600 border border-transparent'}`}>
                <Globe size={18} /> WordPress
              </button>
              <button className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formData.platform === 'Shopify' ? 'bg-brand-50 text-brand-900 border border-brand-100' : 'hover:bg-zinc-50 text-zinc-600 border border-transparent'}`}>
                <ShoppingBag size={18} /> Shopify
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-zinc-50 text-zinc-600 text-sm font-medium border border-transparent transition-colors">
                <Tag size={18} /> GTM
              </button>
            </div>

            <div className="mb-6">
              <p className="text-zinc-600 text-sm leading-relaxed">
                Copy the code below and paste it immediately before the closing <code className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-800 text-xs font-mono">&lt;/head&gt;</code> tag on every page of your website.
              </p>
            </div>

            <div className="relative group">
              <div className="absolute top-3 right-3 z-10">
                <button className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs px-3 py-1.5 rounded-md transition-colors border border-zinc-700">
                  <Copy size={14} /> Copy
                </button>
              </div>
              <pre className="bg-[#18181B] rounded-xl p-5 overflow-x-auto text-sm font-mono leading-relaxed border border-zinc-800 shadow-inner">
                <code className="language-html">
                  <span className="text-zinc-500">&lt;!-- MajorLeads Tracker --&gt;</span>
                  {"\n"}<span className="text-purple-400">&lt;script</span>
                  {"\n"}  <span className="text-blue-400">src</span>=<span className="text-green-400">"https://cdn.majorleads.io/v1/tracker.js"</span>
                  {"\n"}  <span className="text-blue-400">data-token</span>=<span className="text-green-400">"pk_live_ABC123XYZ789"</span>
                  {"\n"}  <span className="text-blue-400">async</span><span className="text-purple-400">&gt;</span>
                  {"\n"}<span className="text-purple-400">&lt;/script&gt;</span>
                </code>
              </pre>
            </div>

            <div className="mt-6 flex items-start gap-3 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100">
              <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
              <p>Need help? Our team can install this for you for free. <a href="#" className="underline hover:text-blue-900">Request free installation</a>.</p>
            </div>
          </div>

          <div className="px-8 py-5 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
            <button
              onClick={prevStep}
              className="text-zinc-500 hover:text-zinc-800 text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <ChevronLeft size={18} />
              Back
            </button>
            <div className="flex gap-3">
              <button className="text-zinc-600 hover:text-zinc-900 text-sm font-medium flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-zinc-100 transition-colors">
                <Mail size={18} />
                Email to dev
              </button>
              <button
                onClick={nextStep}
                className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all flex items-center gap-2"
              >
                Verify Installation
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3 CONTENT */}
      {currentStep === 3 && (
        <div className="w-full max-w-xl bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="p-8 flex flex-col items-center text-center">

            <div className="w-full bg-zinc-50 border border-zinc-100 rounded-lg p-4 mb-8 flex items-center gap-4 text-left">
              <div className="w-12 h-12 bg-white rounded-lg border border-zinc-200 flex items-center justify-center shrink-0">
                <Globe className="text-brand-600" size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-zinc-900 font-semibold truncate">{formData.siteName}</h3>
                <p className="text-zinc-500 text-sm truncate">{formData.siteUrl}</p>
              </div>
              <div className="px-2 py-1 bg-zinc-200 rounded text-xs text-zinc-600 font-medium">
                {formData.platform}
              </div>
            </div>

            {verificationStatus === 'idle' && (
              <div className="py-4">
                <button
                  onClick={checkInstallation}
                  className="w-full sm:w-64 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl text-base font-semibold shadow-lg shadow-brand-200 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  Check Installation
                </button>
              </div>
            )}

            {verificationStatus === 'checking' && (
              <div className="py-8 flex flex-col items-center">
                <Loader2 size={48} className="text-brand-600 animate-spin mb-4" />
                <p className="text-zinc-500 font-medium animate-pulse">Checking for script...</p>
              </div>
            )}

            {verificationStatus === 'success' && (
              <div className="py-2 flex flex-col items-center animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                  <Check size={32} strokeWidth={3} />
                </div>
                <h2 className="text-xl font-bold text-zinc-900 mb-1">Script detected!</h2>
                <p className="text-zinc-500 mb-6 max-w-xs">We received the first event from <strong>{new URL(formData.siteUrl).hostname}</strong>.</p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full sm:w-64 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl text-base font-semibold shadow-lg shadow-green-200 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  Go to Dashboard
                  <ArrowRight size={18} />
                </button>
              </div>
            )}

            {verificationStatus === 'error' && (
              <div className="py-2 flex flex-col items-center animate-in shake duration-300">
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle size={32} strokeWidth={3} />
                </div>
                <h2 className="text-xl font-bold text-zinc-900 mb-1">Script not detected yet</h2>
                <p className="text-zinc-500 mb-6 max-w-sm">Make sure the code is pasted before the <code className="bg-zinc-100 px-1 rounded text-zinc-700 text-xs font-mono">&lt;/head&gt;</code> tag and you have visited the site at least once.</p>
                <div className="pt-4 mt-8 border-t border-zinc-100 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="text-sm text-zinc-500 hover:text-zinc-700 font-medium transition-colors"
                  >
                    View Instructions
                  </button>
                  <button
                    onClick={checkInstallation}
                    className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

          </div>

          <div className="px-8 py-4 bg-zinc-50 border-t border-zinc-200 flex justify-start">
            <button
              onClick={prevStep}
              className="text-zinc-500 hover:text-zinc-800 text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <ChevronLeft size={18} />
              Back
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-zinc-400 hover:text-zinc-600 text-sm transition-colors"
        >
          Skip for now and go to dashboard
        </button>
      </div>
    </div>
  );
};