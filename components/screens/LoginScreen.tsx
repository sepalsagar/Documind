'use client';

import React, { useState } from 'react';

interface LoginScreenProps {
  onLoginSuccess: (user?: { id: string; name: string; email: string }) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('alex@documind.ai');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeCitationHighlight, setActiveCitationHighlight] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsAuthenticating(true);

    try {
      if (isRegisterMode) {
        if (!name.trim()) {
          setErrorMessage('Please enter your full name.');
          setIsAuthenticating(false);
          return;
        }
        if (password.length < 8) {
          setErrorMessage('Password must be at least 8 characters long.');
          setIsAuthenticating(false);
          return;
        }

        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
        });

        const data = await res.json();

        if (!res.ok) {
          setErrorMessage(data.error || 'Registration failed. Please try again.');
          setIsAuthenticating(false);
          return;
        }

        setAuthSuccess(true);
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 500);
      } else {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
        });

        const data = await res.json();

        if (!res.ok) {
          setErrorMessage(data.error || 'Invalid email address or password.');
          setIsAuthenticating(false);
          return;
        }

        setAuthSuccess(true);
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 500);
      }
    } catch {
      setErrorMessage('Network error or server unavailable. Please try again.');
      setIsAuthenticating(false);
    }
  };

  const handleSsoClick = () => {
    setErrorMessage(
      'Enterprise SSO (Google Workspace & SAML) will be enabled in Stage 2. Please use email & password.'
    );
  };

  return (
    <main className="w-full min-h-screen bg-slate-50/80 flex flex-col justify-center items-center relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0d94880a_1px,transparent_1px),linear-gradient(to_bottom,#0d94880a_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none"></div>

      <div className="flex flex-col w-full relative z-10">
        <div className="w-full max-w-[1360px] mx-auto px-6 md:px-8 lg:px-10 py-8 flex flex-col justify-center min-h-[calc(100vh-2rem)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* LEFT COLUMN: AUTHENTICATION FORM */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-white p-7 md:p-9 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)]">
              {/* Brand & Header */}
              <div className="flex flex-col space-y-5">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0d9488] to-[#2dd4bf] flex items-center justify-center shadow-md shadow-teal-700/20 text-white">
                    <span className="material-symbols-outlined text-[1.25rem]">auto_stories</span>
                  </div>
                  <span className="text-[22px] tracking-tight text-slate-900 font-bold">
                    DocuMind
                  </span>
                  <span className="bg-teal-50 text-teal-800 border border-teal-200/70 font-mono text-[11px] px-2 py-0.5 rounded-md font-semibold tracking-wide ml-1">
                    v2.4
                  </span>
                </div>

                <div className="space-y-1.5 pt-2">
                  <h1 className="text-[26px] leading-tight text-slate-900 tracking-tight font-bold">
                    {isRegisterMode
                      ? 'Create your DocuMind account.'
                      : 'Your documents, intelligently searchable.'}
                  </h1>
                  <p className="text-[14px] text-slate-600 leading-relaxed">
                    {isRegisterMode
                      ? 'Register with work credentials to establish your private document index.'
                      : 'Upload PDFs, ask questions, and get answers grounded in the content you provide.'}
                  </p>
                </div>
              </div>

              {/* Error Notice */}
              {errorMessage && (
                <div className="mt-4 flex items-center gap-2.5 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-[12.5px] animate-in fade-in duration-150">
                  <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Interactive Form Section */}
              <form
                id="loginForm"
                onSubmit={handleSubmit}
                className="flex flex-col space-y-4 my-6"
              >
                {/* Full Name Input (Register mode only) */}
                {isRegisterMode && (
                  <div className="flex flex-col space-y-1.5 animate-in fade-in duration-150">
                    <label
                      htmlFor="fullName"
                      className="text-[13px] text-slate-800 font-semibold flex justify-between"
                    >
                      Full Name
                      <span className="font-mono text-[11px] text-slate-400 uppercase tracking-wider font-medium">
                        required
                      </span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[1.125rem]">
                        person
                      </span>
                      <input
                        id="fullName"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Alex Rivera"
                        required
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/70 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-[14px] rounded-xl focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10 transition-all duration-150 shadow-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Email Input */}
                <div className="flex flex-col space-y-1.5">
                  <label
                    htmlFor="workEmail"
                    className="text-[13px] text-slate-800 font-semibold flex justify-between"
                  >
                    Work Email
                    <span className="font-mono text-[11px] text-slate-400 uppercase tracking-wider font-medium">
                      corporate domain
                    </span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[1.125rem]">
                      mail
                    </span>
                    <input
                      id="workEmail"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/70 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-[14px] rounded-xl focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10 transition-all duration-150 shadow-sm"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="flex flex-col space-y-1.5">
                  <label htmlFor="userPassword" className="text-[13px] text-slate-800 font-semibold">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[1.125rem]">
                      lock
                    </span>
                    <input
                      id="userPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isRegisterMode ? 'Minimum 8 characters' : 'Enter password'}
                      required
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50/70 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-[14px] rounded-xl focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10 transition-all duration-150 shadow-sm"
                    />
                    <button
                      type="button"
                      id="togglePasswordBtn"
                      onClick={() => setShowPassword(!showPassword)}
                      title="Toggle password view"
                      className="absolute right-2.5 p-1.5 text-slate-400 hover:text-slate-700 transition-colors flex items-center justify-center rounded-lg hover:bg-slate-100"
                    >
                      <span className="material-symbols-outlined text-[1.125rem]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Options Row */}
                {!isRegisterMode && (
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                      <input
                        id="rememberMe"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded-md border-slate-300 text-teal-600 focus:ring-teal-500 focus:ring-offset-0 cursor-pointer accent-teal-600"
                      />
                      <span className="text-[12.5px] text-slate-600">Remember for 30 days</span>
                    </label>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        alert('Password recovery link sent to ' + email);
                      }}
                      className="text-[12.5px] text-teal-700 hover:text-teal-800 font-semibold transition-colors"
                    >
                      Forgot password?
                    </a>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  id="submitBtn"
                  disabled={isAuthenticating}
                  className="mt-2 w-full py-2.5 px-4 bg-[#0d9488] hover:bg-[#0f766e] active:scale-[0.99] text-white text-[14px] font-semibold rounded-xl shadow-md shadow-teal-800/15 flex items-center justify-center space-x-2 transition-all duration-150 group"
                >
                  {isAuthenticating ? (
                    <>
                      <span className="material-symbols-outlined text-[1.125rem] animate-spin">
                        progress_activity
                      </span>
                      <span>
                        {isRegisterMode ? 'Creating account...' : 'Authenticating...'}
                      </span>
                    </>
                  ) : authSuccess ? (
                    <>
                      <span className="material-symbols-outlined text-[1.125rem]">check</span>
                      <span>{isRegisterMode ? 'Account Created' : 'Authenticated'}</span>
                    </>
                  ) : (
                    <>
                      <span className="tracking-wide">
                        {isRegisterMode ? 'Create DocuMind Account' : 'Sign in to DocuMind'}
                      </span>
                      <span className="material-symbols-outlined text-[1.125rem] group-hover:translate-x-0.5 transition-transform">
                        arrow_forward
                      </span>
                    </>
                  )}
                </button>

                {/* SSO separator */}
                <div className="relative py-2 flex items-center justify-center">
                  <div className="w-full bg-slate-200/90 h-[1px]"></div>
                  <span className="absolute bg-white px-3 font-mono text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                    or sign in with
                  </span>
                </div>

                {/* Fast SSO Action */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleSsoClick}
                    className="flex items-center justify-center space-x-2 py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[12.5px] rounded-xl transition-all shadow-sm hover:border-slate-300 font-semibold"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        fill="#EA4335"
                      />
                    </svg>
                    <span>Google SSO</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSsoClick}
                    className="flex items-center justify-center space-x-2 py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[12.5px] rounded-xl transition-all shadow-sm hover:border-slate-300 font-semibold"
                  >
                    <span className="material-symbols-outlined text-[1.125rem] text-slate-600">
                      domain
                    </span>
                    <span>SAML / Okta</span>
                  </button>
                </div>
              </form>

              {/* Footer / Register Link */}
              <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                <p className="text-[12.5px] text-slate-600">
                  {isRegisterMode ? (
                    <>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setIsRegisterMode(false);
                          setErrorMessage(null);
                        }}
                        className="text-teal-700 hover:text-teal-900 font-semibold transition-colors ml-1"
                      >
                        Sign in
                      </button>
                    </>
                  ) : (
                    <>
                      Don&apos;t have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setIsRegisterMode(true);
                          setErrorMessage(null);
                        }}
                        className="text-teal-700 hover:text-teal-900 font-semibold transition-colors ml-1"
                      >
                        Create one
                      </button>
                    </>
                  )}
                </p>
                <span className="font-mono text-[11px] text-slate-400 font-medium">
                  TLS 1.3 Encrypted
                </span>
              </div>
            </div>

            {/* RIGHT COLUMN: VISUAL PRODUCT RAG PREVIEW */}
            <div className="lg:col-span-7 bg-gradient-to-br from-[#f0fdfa] via-[#e6f4f1] to-[#e2ece9] border border-teal-900/10 rounded-2xl p-7 md:p-9 flex flex-col justify-between relative overflow-hidden shadow-sm">
              {/* Ambient subtle accent glow inside container */}
              <div className="absolute -right-24 -top-24 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

              {/* Top Section: Header Badge & Retrieval Status */}
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-white/95 backdrop-blur-md rounded-full border border-teal-200/80 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                  <span className="text-[12px] text-teal-900 font-bold tracking-tight">
                    100% Grounded in your PDF • Zero Hallucinations
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 font-mono text-[11px] text-teal-900 bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-full border border-teal-100 font-semibold">
                  <span className="material-symbols-outlined text-[1rem] text-teal-600">
                    verified
                  </span>
                  <span>Cosine Sim: 0.942</span>
                </div>
              </div>

              {/* Middle Visual Stage: Document Chunk & Synthesis Preview */}
              <div className="relative z-10 flex flex-col space-y-4 my-auto">
                {/* Document Card Source */}
                <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 border border-slate-200/70 shadow-[0_4px_16px_-4px_rgba(15,23,42,0.05)] transition-transform hover:-translate-y-0.5 duration-200">
                  <div className="flex items-center justify-between pb-2.5">
                    <div className="flex items-center space-x-2">
                      <span className="material-symbols-outlined text-rose-500 text-[1.25rem]">
                        picture_as_pdf
                      </span>
                      <span className="text-[14.5px] text-slate-900 font-bold truncate">
                        Attention_Is_All_You_Need.pdf
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="bg-slate-100 text-slate-700 font-mono text-[10px] px-2 py-0.5 rounded-md font-medium">
                        Page 4 • Chunk 12
                      </span>
                      <span className="bg-teal-100 text-teal-900 border border-teal-200 font-mono text-[10px] px-2 py-0.5 rounded-md font-bold">
                        Indexed
                      </span>
                    </div>
                  </div>

                  {/* PDF Chunk Text Preview */}
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-[13px] text-slate-700 leading-relaxed">
                    &quot;...The dominant sequence transduction models are based on complex
                    recurrent or convolutional neural networks. We propose the{' '}
                    <mark className="bg-teal-100 text-teal-900 font-semibold px-1.5 py-0.5 rounded border border-teal-200">
                      Transformer
                    </mark>
                    , a model architecture eschewing recurrence and relying entirely on an{' '}
                    <mark className="bg-teal-100 text-teal-900 font-semibold px-1.5 py-0.5 rounded border border-teal-200">
                      attention mechanism
                    </mark>{' '}
                    to draw global dependencies...&quot;
                  </div>

                  <div className="flex items-center justify-between pt-2 font-mono text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                      Embeddings: text-embedding-3-large
                    </span>
                    <span className="font-semibold text-slate-600">184 tokens</span>
                  </div>
                </div>

                {/* Connecting Retrieval Flow Indicator */}
                <div className="flex items-center justify-center space-x-2 -my-1 text-teal-700">
                  <span className="material-symbols-outlined text-[1rem]">arrow_downward</span>
                  <span className="font-mono text-[10.5px] uppercase tracking-wider font-bold">
                    Deterministic RAG Synthesizer
                  </span>
                  <span className="material-symbols-outlined text-[1rem]">arrow_downward</span>
                </div>

                {/* Grounded Answer Synthesis Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 border border-slate-200/70 shadow-[0_4px_16px_-4px_rgba(15,23,42,0.05)]">
                  <div className="flex items-center justify-between pb-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="material-symbols-outlined text-teal-600 text-[1.2rem]">
                        auto_awesome
                      </span>
                      <span className="text-[13px] text-slate-900 font-bold">
                        Generated Answer with Attributions
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-500 font-medium">
                      Latency: 284ms
                    </span>
                  </div>

                  <p className="text-[13.5px] text-slate-800 leading-relaxed pt-1.5">
                    The architecture completely eliminates recurrence by leveraging multi-head
                    self-attention mechanisms{' '}
                    <span
                      onMouseEnter={() => setActiveCitationHighlight(1)}
                      onMouseLeave={() => setActiveCitationHighlight(null)}
                      className={`inline-flex items-center px-1.5 py-0.5 rounded font-mono text-[11px] font-bold cursor-pointer transition-colors mx-0.5 border ${
                        activeCitationHighlight === 1
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-teal-100 text-teal-900 border-teal-200 hover:bg-teal-600 hover:text-white'
                      }`}
                    >
                      [1]
                    </span>{' '}
                    to map global dependencies between input and output sequences directly{' '}
                    <span
                      onMouseEnter={() => setActiveCitationHighlight(2)}
                      onMouseLeave={() => setActiveCitationHighlight(null)}
                      className={`inline-flex items-center px-1.5 py-0.5 rounded font-mono text-[11px] font-bold cursor-pointer transition-colors mx-0.5 border ${
                        activeCitationHighlight === 2
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-teal-100 text-teal-900 border-teal-200 hover:bg-teal-600 hover:text-white'
                      }`}
                    >
                      [2]
                    </span>
                    .
                  </p>

                  {/* Grounding citation cards row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3">
                    <div
                      className={`border p-2.5 rounded-lg flex items-center space-x-2 transition-all ${
                        activeCitationHighlight === 1
                          ? 'bg-teal-50 border-teal-400 shadow-xs'
                          : 'bg-slate-50 border-slate-200/70'
                      }`}
                    >
                      <span className="bg-teal-600 text-white font-mono text-[10px] px-1.5 py-0.5 rounded font-bold shadow-xs">
                        [1]
                      </span>
                      <span className="text-[12px] text-slate-700 font-medium truncate">
                        Sec 3.1 Architecture Overview
                      </span>
                    </div>

                    <div
                      className={`border p-2.5 rounded-lg flex items-center space-x-2 transition-all ${
                        activeCitationHighlight === 2
                          ? 'bg-teal-50 border-teal-400 shadow-xs'
                          : 'bg-slate-50 border-slate-200/70'
                      }`}
                    >
                      <span className="bg-teal-600 text-white font-mono text-[10px] px-1.5 py-0.5 rounded font-bold shadow-xs">
                        [2]
                      </span>
                      <span className="text-[12px] text-slate-700 font-medium truncate">
                        Equation 1: Scaled Dot-Product
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Stats & System Performance Indicator */}
              <div className="relative z-10 pt-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-6">
                  <div>
                    <div className="text-[17px] text-slate-900 font-bold">99.8%</div>
                    <div className="font-mono text-[10.5px] text-slate-600 font-medium">
                      Grounding Precision
                    </div>
                  </div>
                  <div>
                    <div className="text-[17px] text-slate-900 font-bold">&lt;350ms</div>
                    <div className="font-mono text-[10.5px] text-slate-600 font-medium">
                      Vector Search Latency
                    </div>
                  </div>
                  <div>
                    <div className="text-[17px] text-slate-900 font-bold">SOC2 Type II</div>
                    <div className="font-mono text-[10.5px] text-slate-600 font-medium">
                      Enterprise Ready
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 bg-white/95 backdrop-blur-sm border border-teal-200/80 px-3 py-1.5 rounded-lg shadow-sm">
                  <span className="material-symbols-outlined text-teal-600 text-[1rem]">
                    lock_clock
                  </span>
                  <span className="font-mono text-[11px] text-slate-800 font-bold tracking-tight">
                    Zero Data Retention
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
